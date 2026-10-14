import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SeatItem {
  id: string;
  ticketTierId: string;
  tierName: string;
  rowName: string;
  seatNumber: string;
  status: 'Available' | 'Locked' | 'Sold';
  price: number;
  colorHex: string;
}

@Component({
  selector: 'app-seat-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 select-none">
      <!-- Stage Indicator -->
      <div class="mb-10 text-center">
        <div class="mx-auto max-w-md h-9 bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-600 rounded-b-2xl shadow-lg shadow-purple-500/20 flex items-center justify-center border-t border-purple-400/30">
          <span class="text-xs font-bold tracking-widest uppercase text-white drop-shadow">🎭 SÂN KHẤU TRÌNH DIỄN (STAGE)</span>
        </div>
      </div>

      <!-- SVG 2D Interactive Seat Map -->
      <div class="w-full overflow-x-auto flex justify-center py-4">
        <svg [attr.viewBox]="svgViewBox()" class="max-w-full h-auto min-w-[580px]">
          @for (row of seatRows(); track row.rowName) {
            <!-- Row Label Left -->
            <text [attr.x]="20" [attr.y]="row.y + 18"
              class="fill-slate-400 text-[13px] font-bold" text-anchor="middle">
              {{ row.rowName }}
            </text>

            <!-- Seats in Row -->
            @for (seat of row.seats; track seat.id) {
              <g (click)="onSeatClick(seat)"
                 class="transition-transform duration-150 cursor-pointer"
                 [class.cursor-not-allowed]="seat.status !== 'Available'"
                 [class.hover:scale-110]="seat.status === 'Available'">
                <!-- Seat Shape -->
                <rect
                  [attr.x]="seat.x"
                  [attr.y]="row.y"
                  width="36"
                  height="34"
                  rx="7"
                  [attr.fill]="getSeatFillColor(seat)"
                  [attr.stroke]="getSeatStrokeColor(seat)"
                  [attr.stroke-width]="selectedSeatIds().has(seat.id) ? 3 : 1.5"
                  [attr.opacity]="seat.status === 'Sold' ? 0.35 : (seat.status === 'Locked' ? 0.6 : 1)"
                />

                <!-- Seat Number Label -->
                <text
                  [attr.x]="seat.x + 18"
                  [attr.y]="row.y + 21"
                  text-anchor="middle"
                  [attr.fill]="selectedSeatIds().has(seat.id) ? '#ffffff' : (seat.status === 'Sold' ? '#64748b' : '#f8fafc')"
                  class="text-[11px] font-semibold pointer-events-none">
                  {{ seat.seatNumber }}
                </text>
              </g>
            }

            <!-- Row Label Right -->
            <text [attr.x]="rowWidth() - 20" [attr.y]="row.y + 18"
              class="fill-slate-400 text-[13px] font-bold" text-anchor="middle">
              {{ row.rowName }}
            </text>
          }
        </svg>
      </div>

      <!-- Legend -->
      <div class="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded bg-purple-600/30 border border-purple-500"></div>
          <span>VIP (Hàng A-B)</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded bg-blue-600/30 border border-blue-500"></div>
          <span>Standard (Hàng C-F)</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded bg-emerald-500 border border-emerald-300 ring-2 ring-emerald-500/30"></div>
          <span class="font-semibold text-emerald-400">Đang chọn</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded bg-amber-500/40 border border-amber-500"></div>
          <span>Đang giữ chỗ</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded bg-slate-800 border border-slate-700 opacity-40"></div>
          <span class="text-slate-500">Đã bán</span>
        </div>
      </div>
    </div>
  `
})
export class SeatMapComponent {
  @Input({ required: true }) seats: SeatItem[] = [];
  @Output() selectionChange = new EventEmitter<SeatItem[]>();

  readonly selectedSeatIds = signal<Set<string>>(new Set());
  readonly rowWidth = signal(650);

  readonly seatRows = computed(() => {
    const rowsRecord: Record<string, SeatItem[]> = {};
    for (const seat of this.seats) {
      if (!rowsRecord[seat.rowName]) {
        rowsRecord[seat.rowName] = [];
      }
      rowsRecord[seat.rowName].push(seat);
    }

    const result: Array<{
      rowName: string;
      y: number;
      seats: Array<SeatItem & { x: number }>;
    }> = [];

    const sortedRowNames = Object.keys(rowsRecord).sort();
    let currentY = 20;

    for (const rowName of sortedRowNames) {
      const seatsInRow = rowsRecord[rowName];
      seatsInRow.sort((a, b) => a.seatNumber.localeCompare(b.seatNumber));

      const startX = 65;
      const spacing = 52;

      const positionedSeats = seatsInRow.map((s, idx) => ({
        ...s,
        x: startX + idx * spacing
      }));

      result.push({
        rowName,
        y: currentY,
        seats: positionedSeats
      });

      currentY += 50;
    }

    return result;
  });

  readonly svgViewBox = computed(() => {
    const rowCount = this.seatRows().length;
    const height = Math.max(rowCount * 50 + 40, 200);
    return `0 0 ${this.rowWidth()} ${height}`;
  });

  onSeatClick(seat: SeatItem): void {
    if (seat.status !== 'Available') return;

    const current = new Set(this.selectedSeatIds());
    if (current.has(seat.id)) {
      current.delete(seat.id);
    } else {
      if (current.size >= 10) {
        alert('Bạn chỉ được chọn tối đa 10 ghế trong một đơn đặt.');
        return;
      }
      current.add(seat.id);
    }

    this.selectedSeatIds.set(current);
    const selectedList = this.seats.filter(s => current.has(s.id));
    this.selectionChange.emit(selectedList);
  }

  getSeatFillColor(seat: SeatItem): string {
    if (this.selectedSeatIds().has(seat.id)) return '#10b981';
    if (seat.status === 'Sold') return '#1e293b';
    if (seat.status === 'Locked') return '#78350f';
    return seat.rowName === 'A' || seat.rowName === 'B' ? '#581c87' : '#1e3a8a';
  }

  getSeatStrokeColor(seat: SeatItem): string {
    if (this.selectedSeatIds().has(seat.id)) return '#6ee7b7';
    if (seat.status === 'Sold') return '#334155';
    if (seat.status === 'Locked') return '#f59e0b';
    return seat.rowName === 'A' || seat.rowName === 'B' ? '#c084fc' : '#60a5fa';
  }
}
