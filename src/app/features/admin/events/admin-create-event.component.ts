import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

interface TierItem {
  name: string;
  price: number;
  colorHex: string;
}

interface PreviewSeat {
  id: string;
  row: string;
  number: string;
  tierName: string;
  color: string;
  cx: number;
  cy: number;
}

@Component({
  selector: 'app-admin-create-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="max-w-6xl mx-auto space-y-8 pb-16">
      <!-- Breadcrumb & Header -->
      <div class="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div class="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <a routerLink="/admin" class="hover:text-purple-400 transition">Quản trị</a>
            <span>/</span>
            <span class="text-slate-200">Tạo Show diễn mới</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white">Xuất bản Show & Cấu hình Ghế</h1>
          <p class="text-xs text-slate-400">Tạo sự kiện, cấu hình phân hạng vé và trực quan hóa sơ đồ ghế 2D</p>
        </div>

        <a routerLink="/admin" class="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition">
          ← Quay lại Dashboard
        </a>
      </div>

      <!-- Main Form Grid -->
      <form [formGroup]="eventForm" (ngSubmit)="onSubmit()" class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Left: Form Inputs (7 cols) -->
        <div class="lg:col-span-7 space-y-6">
          <!-- Step 1: Show Info -->
          <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-purple-600/30 text-purple-400 text-xs flex items-center justify-center font-extrabold">1</span>
              <span>Thông tin Buổi biểu diễn</span>
            </h2>

            <div class="space-y-4 text-xs">
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Tên sự kiện / Show diễn *</label>
                <input type="text" formControlName="title" placeholder="VD: Live Concert Anh Trai Say Hi 2026"
                  class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500" />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-slate-300 font-semibold mb-1">Tên địa điểm / Nhà hát *</label>
                  <input type="text" formControlName="venueName" placeholder="VD: Trung tâm Hội nghị Quốc gia"
                    class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label class="block text-slate-300 font-semibold mb-1">Địa chỉ chi tiết</label>
                  <input type="text" formControlName="venueAddress" placeholder="VD: Đại lộ Thăng Long, Mễ Trì, Hà Nội"
                    class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500" />
                </div>
              </div>

              <div>
                <label class="block text-slate-300 font-semibold mb-1">URL Ảnh Poster Banner</label>
                <input type="text" formControlName="bannerUrl" placeholder="https://..."
                  class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono" />
              </div>

              <div>
                <label class="block text-slate-300 font-semibold mb-1">Giới thiệu ngắn sự kiện</label>
                <textarea rows="3" formControlName="description" placeholder="Mô tả nội dung, nghệ sĩ biểu diễn..."
                  class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"></textarea>
              </div>
            </div>
          </div>

          <!-- Step 2: Timing -->
          <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-purple-600/30 text-purple-400 text-xs flex items-center justify-center font-extrabold">2</span>
              <span>Lịch trình & Khung giờ Bán vé</span>
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Thời gian Bắt đầu show *</label>
                <input type="datetime-local" formControlName="startTime"
                  class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Thời gian Kết thúc show *</label>
                <input type="datetime-local" formControlName="endTime"
                  class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Bắt đầu Mở bán vé *</label>
                <input type="datetime-local" formControlName="salesStartTime"
                  class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Đóng cổng Bán vé *</label>
                <input type="datetime-local" formControlName="salesEndTime"
                  class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500" />
              </div>
            </div>
          </div>

          <!-- Step 3: Ticket Tiers & Pricing -->
          <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-bold text-white flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-purple-600/30 text-purple-400 text-xs flex items-center justify-center font-extrabold">3</span>
                <span>Phân loại Hạng vé & Mức giá</span>
              </h2>
            </div>

            <div class="space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <!-- Tier 1: VIP -->
                <div class="p-3 bg-slate-950 border border-purple-500/30 rounded-2xl space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-purple-300">Hạng vé 1 (VIP)</span>
                    <input type="color" formControlName="tier1Color" class="w-6 h-6 rounded border-0 bg-transparent cursor-pointer" />
                  </div>
                  <div>
                    <label class="block text-slate-400 mb-1">Tên hạng vé</label>
                    <input type="text" formControlName="tier1Name"
                      class="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white" />
                  </div>
                  <div>
                    <label class="block text-slate-400 mb-1">Giá vé (₫)</label>
                    <input type="number" formControlName="tier1Price"
                      class="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono" />
                  </div>
                </div>

                <!-- Tier 2: Standard -->
                <div class="p-3 bg-slate-950 border border-cyan-500/30 rounded-2xl space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-cyan-300">Hạng vé 2 (Standard)</span>
                    <input type="color" formControlName="tier2Color" class="w-6 h-6 rounded border-0 bg-transparent cursor-pointer" />
                  </div>
                  <div>
                    <label class="block text-slate-400 mb-1">Tên hạng vé</label>
                    <input type="text" formControlName="tier2Name"
                      class="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white" />
                  </div>
                  <div>
                    <label class="block text-slate-400 mb-1">Giá vé (₫)</label>
                    <input type="number" formControlName="tier2Price"
                      class="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 4: Seat Matrix Config -->
          <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-purple-600/30 text-purple-400 text-xs flex items-center justify-center font-extrabold">4</span>
              <span>Cấu hình Ma trận Ghế ngồi</span>
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Số hàng ghế (A - Z)</label>
                <input type="number" formControlName="rowCount" min="1" max="10"
                  class="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono" />
                <span class="text-[11px] text-slate-500 mt-1 block">Tối đa 10 hàng</span>
              </div>
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Số ghế mỗi hàng</label>
                <input type="number" formControlName="seatsPerRow" min="1" max="20"
                  class="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono" />
                <span class="text-[11px] text-slate-500 mt-1 block">Tối đa 20 ghế/hàng</span>
              </div>
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Số hàng đầu là VIP</label>
                <input type="number" formControlName="vipRowsCount" min="0" max="10"
                  class="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono" />
                <span class="text-[11px] text-slate-500 mt-1 block">Còn lại là Standard</span>
              </div>
            </div>
          </div>

          <!-- Submit Buttons -->
          <div class="flex items-center gap-4 pt-2">
            <button type="submit" [disabled]="eventForm.invalid || submitting()"
              class="flex-1 py-3.5 px-6 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition shadow-lg shadow-purple-600/30 text-sm">
              {{ submitting() ? 'Đang tạo dữ liệu & sinh sơ đồ ghế...' : '🚀 Xuất bản Show & Mở bán vé' }}
            </button>
            <a routerLink="/admin" class="px-6 py-3.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition">
              Hủy bỏ
            </a>
          </div>
        </div>

        <!-- Right: Live 2D SVG Preview (5 cols sticky) -->
        <div class="lg:col-span-5 space-y-6">
          <div class="sticky top-6 p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <span>👁️</span>
                <span>Xem trước Sơ đồ ghế (Live SVG)</span>
              </h3>
              <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {{ totalCapacity() }} Ghế vật lý
              </span>
            </div>

            <!-- Capacity & Revenue Summary -->
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span class="text-slate-400 block text-[11px]">Doanh thu tối đa</span>
                <span class="font-extrabold text-purple-400 text-sm mt-0.5 block">
                  {{ potentialRevenue() | number:'1.0-0' }} ₫
                </span>
              </div>
              <div class="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span class="text-slate-400 block text-[11px]">Quy mô khán phòng</span>
                <span class="font-extrabold text-white text-sm mt-0.5 block">
                  {{ rowsCount() }} Hàng × {{ colsCount() }} Cột
                </span>
              </div>
            </div>

            <!-- SVG Seat Canvas -->
            <div class="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center overflow-x-auto min-h-[340px]">
              <!-- Stage -->
              <div class="w-48 h-7 mb-6 rounded-b-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 flex items-center justify-center text-[10px] font-extrabold text-white tracking-widest uppercase shadow-md shadow-purple-600/20">
                SÂN KHẤU / STAGE
              </div>

              <!-- SVG Elements -->
              <svg [attr.width]="svgWidth()" [attr.height]="svgHeight()" class="select-none">
                @for (seat of previewSeats(); track seat.id) {
                  <g [attr.transform]="'translate(' + seat.cx + ',' + seat.cy + ')'">
                    <rect x="-11" y="-11" width="22" height="22" rx="5"
                      [attr.fill]="seat.color" fill-opacity="0.25"
                      [attr.stroke]="seat.color" stroke-width="1.5" />
                    <text x="0" y="3" text-anchor="middle" font-size="8" font-family="monospace" font-weight="bold" fill="#ffffff">
                      {{ seat.row }}{{ seat.number }}
                    </text>
                  </g>
                }
              </svg>
            </div>

            <!-- Legend -->
            <div class="flex items-center justify-center gap-6 pt-2 text-xs">
              <div class="flex items-center gap-2">
                <span class="w-3.5 h-3.5 rounded" [style.backgroundColor]="eventForm.get('tier1Color')?.value"></span>
                <span class="text-slate-300 font-medium">{{ eventForm.get('tier1Name')?.value }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-3.5 h-3.5 rounded" [style.backgroundColor]="eventForm.get('tier2Color')?.value"></span>
                <span class="text-slate-300 font-medium">{{ eventForm.get('tier2Name')?.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  `
})
export class AdminCreateEventComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);

  // Set default dates: Show tomorrow evening, sales starting today
  private readonly now = new Date();
  private readonly showDate = new Date(this.now.getTime() + 7 * 24 * 3600 * 1000); // 7 days later
  private readonly showEndDate = new Date(this.showDate.getTime() + 4 * 3600 * 1000);
  private readonly salesEndDate = new Date(this.showDate.getTime() - 24 * 3600 * 1000); // 1 day before show

  readonly eventForm = this.fb.group({
    title: ['Live Concert Anh Trai Say Hi 2026', [Validators.required]],
    venueName: ['Trung tâm Hội nghị Quốc gia Hà Nội', [Validators.required]],
    venueAddress: ['Đại lộ Thăng Long, Mễ Trì, Nam Từ Liêm, Hà Nội'],
    bannerUrl: ['https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200'],
    description: ['Đại nhạc hội bùng nổ quy tụ dàn nghệ sĩ hàng đầu Việt Nam. Hệ thống âm thanh ánh sáng chuẩn quốc tế.'],
    startTime: [this.formatDateForInput(this.showDate), [Validators.required]],
    endTime: [this.formatDateForInput(this.showEndDate), [Validators.required]],
    salesStartTime: [this.formatDateForInput(this.now), [Validators.required]],
    salesEndTime: [this.formatDateForInput(this.salesEndDate), [Validators.required]],
    // Tier 1 (VIP)
    tier1Name: ['VIP Zone', [Validators.required]],
    tier1Price: [1500000, [Validators.required, Validators.min(1000)]],
    tier1Color: ['#8b5cf6'],
    // Tier 2 (Standard)
    tier2Name: ['Standard Zone', [Validators.required]],
    tier2Price: [650000, [Validators.required, Validators.min(1000)]],
    tier2Color: ['#06b6d4'],
    // Matrix
    rowCount: [6, [Validators.required, Validators.min(1), Validators.max(10)]],
    seatsPerRow: [12, [Validators.required, Validators.min(1), Validators.max(20)]],
    vipRowsCount: [2, [Validators.required, Validators.min(0)]]
  });

  private formatDateForInput(d: Date): string {
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
    return localIso.slice(0, 16);
  }

  // Reactive calculations
  readonly rowsCount = computed(() => Number(this.eventForm.get('rowCount')?.value) || 6);
  readonly colsCount = computed(() => Number(this.eventForm.get('seatsPerRow')?.value) || 12);
  readonly vipRows = computed(() => Number(this.eventForm.get('vipRowsCount')?.value) || 2);

  readonly totalCapacity = computed(() => this.rowsCount() * this.colsCount());

  readonly potentialRevenue = computed(() => {
    const rCount = this.rowsCount();
    const cCount = this.colsCount();
    const vRows = Math.min(this.vipRows(), rCount);
    const sRows = rCount - vRows;

    const vPrice = Number(this.eventForm.get('tier1Price')?.value) || 0;
    const sPrice = Number(this.eventForm.get('tier2Price')?.value) || 0;

    return (vRows * cCount * vPrice) + (sRows * cCount * sPrice);
  });

  readonly svgWidth = computed(() => Math.max(340, this.colsCount() * 28 + 20));
  readonly svgHeight = computed(() => this.rowsCount() * 28 + 20);

  readonly previewSeats = computed<PreviewSeat[]>(() => {
    const rCount = Math.min(this.rowsCount(), 10);
    const cCount = Math.min(this.colsCount(), 20);
    const vRows = Math.min(this.vipRows(), rCount);

    const vName = this.eventForm.get('tier1Name')?.value || 'VIP';
    const sName = this.eventForm.get('tier2Name')?.value || 'Standard';
    const vColor = this.eventForm.get('tier1Color')?.value || '#8b5cf6';
    const sColor = this.eventForm.get('tier2Color')?.value || '#06b6d4';

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const seats: PreviewSeat[] = [];

    const startX = 20;
    const startY = 16;
    const gap = 28;

    for (let r = 0; r < rCount; r++) {
      const rowLetter = alphabet[r];
      const isVip = r < vRows;
      const tierName = isVip ? vName : sName;
      const color = isVip ? vColor : sColor;

      for (let c = 1; c <= cCount; c++) {
        const numStr = c.toString().padStart(2, '0');
        seats.push({
          id: `${rowLetter}${numStr}`,
          row: rowLetter,
          number: numStr,
          tierName,
          color,
          cx: startX + (c - 1) * gap,
          cy: startY + r * gap
        });
      }
    }
    return seats;
  });

  onSubmit(): void {
    if (this.eventForm.invalid) return;

    this.submitting.set(true);
    const fv = this.eventForm.getRawValue();

    const rCount = Number(fv.rowCount);
    const cCount = Number(fv.seatsPerRow);
    const vRows = Math.min(Number(fv.vipRowsCount), rCount);
    const sRows = rCount - vRows;

    const vipSeatsTotal = vRows * cCount;
    const stdSeatsTotal = sRows * cCount;

    const payload = {
      title: fv.title,
      venueName: fv.venueName,
      venueAddress: fv.venueAddress,
      bannerUrl: fv.bannerUrl,
      description: fv.description,
      startTime: new Date(fv.startTime!).toISOString(),
      endTime: new Date(fv.endTime!).toISOString(),
      salesStartTime: new Date(fv.salesStartTime!).toISOString(),
      salesEndTime: new Date(fv.salesEndTime!).toISOString(),
      ticketTiers: [
        {
          name: fv.tier1Name,
          price: Number(fv.tier1Price),
          totalQuantity: vipSeatsTotal,
          colorHex: fv.tier1Color
        },
        {
          name: fv.tier2Name,
          price: Number(fv.tier2Price),
          totalQuantity: stdSeatsTotal,
          colorHex: fv.tier2Color
        }
      ],
      generateRowsCount: rCount,
      generateSeatsPerRow: cCount
    };

    this.api.post('events', payload).subscribe({
      next: res => {
        this.submitting.set(false);
        if (res.success) {
          alert('Tạo sự kiện và xuất bản sơ đồ ghế 2D thành công!');
          this.router.navigate(['/admin']);
        }
      },
      error: err => {
        this.submitting.set(false);
        alert(err.message || 'Lỗi khi tạo sự kiện.');
      }
    });
  }
}
