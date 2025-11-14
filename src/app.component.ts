import { Component, ChangeDetectionStrategy, signal, computed, WritableSignal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule]
})
export class AppComponent {
  title = 'Lottery Suspense';

  readonly numbers: Signal<number[]>;
  readonly drawnNumbers: WritableSignal<Set<number>> = signal(new Set());
  readonly lastDrawnNumber: WritableSignal<number | null> = signal(null);
  readonly isDrawing: WritableSignal<boolean> = signal(false);
  readonly animatingNumber: WritableSignal<number | null> = signal(null);

  readonly availableNumbers: Signal<number[]>;
  readonly allNumbersDrawn: Signal<boolean>;

  constructor() {
    const nums = Array.from({ length: 75 }, (_, i) => i + 1);
    this.numbers = signal(nums);

    this.availableNumbers = computed(() => 
      this.numbers().filter(n => !this.drawnNumbers().has(n))
    );
    this.allNumbersDrawn = computed(() => this.availableNumbers().length === 0);
  }

  async drawNumber(): Promise<void> {
    if (this.isDrawing() || this.allNumbersDrawn()) {
      return;
    }

    this.isDrawing.set(true);
    this.lastDrawnNumber.set(null);
    const available = this.availableNumbers();

    if (available.length === 0) {
      this.isDrawing.set(false);
      return;
    }
    
    // 1. Fast animation phase
    const fastAnimationDuration = 5000; // 5 seconds
    const fastAnimationInterval = 50; // update every 50ms
    const startTime = Date.now();
    while (Date.now() - startTime < fastAnimationDuration) {
        const randomIndex = Math.floor(Math.random() * available.length);
        this.animatingNumber.set(available[randomIndex]);
        await new Promise(resolve => setTimeout(resolve, fastAnimationInterval));
    }


    // 2. Slowing down animation with increasing delay for suspense
    const delays = [100, 120, 150, 180, 220, 270, 330, 400, 500, 650];

    for (const delay of delays) {
      const randomIndex = Math.floor(Math.random() * available.length);
      this.animatingNumber.set(available[randomIndex]);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // 3. Select the final number after the animation
    const finalAvailable = this.availableNumbers();
    const finalIndex = Math.floor(Math.random() * finalAvailable.length);
    const finalNumber = finalAvailable[finalIndex];
    
    this.lastDrawnNumber.set(finalNumber);
    this.drawnNumbers.update(currentSet => {
      currentSet.add(finalNumber);
      return new Set(currentSet);
    });
    this.isDrawing.set(false);
    this.animatingNumber.set(null);
  }

  reset(): void {
    if (this.isDrawing()) {
      return;
    }
    
    this.drawnNumbers.set(new Set());
    this.lastDrawnNumber.set(null);
    this.isDrawing.set(false);
    this.animatingNumber.set(null);
  }

  isDrawn(num: number): boolean {
    return this.drawnNumbers().has(num);
  }
}