import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

interface CheckInResult {
  status: 'SUCCESS' | 'ALREADY_USED' | 'INVALID' | 'WRONG_EVENT';
  message: string;
  ticketCode?: string;
  customerName?: string;
  tierName?: string;
  seatLabel?: string;
  checkedInAt?: string;
}

interface OfflineTicket {
  ticketCode: string;
  qrCodeSignature: string;
  tierName: string;
  seatLabel: string;
  customerName: string;
  isCheckedIn: boolean;
}

interface CheckInStats {
  totalTickets: number;
  checkedInCount: number;
  remainingCount: number;
  checkInRate: number;
}

@Component({
  selector: 'app-staff-scanner',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-2">
            <span>📷 CỔNG KIỂM SOÁT VÉ THỜI GIAN THỰC</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white">Soát vé E-Ticket tại cổng</h1>
          <p class="text-xs text-slate-400">Kiểm tra chữ ký số HMAC & ngăn chặn gian lận chụp màn hình vé</p>
        </div>

        <!-- Offline Sync Button -->
        <div class="flex items-center gap-3">
          <button (click)="syncOfflineManifest()" [disabled]="syncing()"
            class="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 transition flex items-center gap-2">
            <span>📥</span>
            <span>{{ syncing() ? 'Đang đồng bộ...' : 'Tải vé chạy Offline (' + offlineCount() + ')' }}</span>
          </button>
        </div>
      </div>

      <!-- Live Stats Header -->
      @if (stats()) {
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center">
            <span class="text-[11px] text-slate-400 font-semibold uppercase">Tổng vé bán ra</span>
            <p class="text-2xl font-extrabold text-white mt-1">{{ stats()?.totalTickets }}</p>
          </div>
          <div class="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center">
            <span class="text-[11px] text-emerald-400 font-semibold uppercase">Đã qua cổng</span>
            <p class="text-2xl font-extrabold text-emerald-400 mt-1">{{ stats()?.checkedInCount }}</p>
          </div>
          <div class="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center">
            <span class="text-[11px] text-slate-400 font-semibold uppercase">Chưa check-in</span>
            <p class="text-2xl font-extrabold text-slate-300 mt-1">{{ stats()?.remainingCount }}</p>
          </div>
          <div class="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center">
            <span class="text-[11px] text-purple-400 font-semibold uppercase">Tỷ lệ Check-in</span>
            <p class="text-2xl font-extrabold text-purple-400 mt-1">{{ stats()?.checkInRate }}%</p>
          </div>
        </div>
      }

      <!-- Scan Input Panel -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <form [formGroup]="scanForm" (ngSubmit)="onScanSubmit()" class="space-y-4">
          <label class="block text-sm font-bold text-white">
            Nhập chuỗi mã QR quét được từ Camera (hoặc paste chuỗi ký số QR):
          </label>
          <div class="flex gap-3">
            <input type="text" formControlName="qrInput" placeholder='Paste chuỗi JSON QR {"payload":...,"signature":...}'
              class="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono" />
            <button type="submit" [disabled]="scanForm.invalid || verifying()"
              class="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl transition text-sm shrink-0 shadow-lg shadow-purple-600/30">
              {{ verifying() ? 'Đang kiểm tra...' : '⚡ Quét vé' }}
            </button>
          </div>
        </form>

        <!-- Scanner Result Alert -->
        @if (lastResult()) {
          <div class="p-6 rounded-2xl border transition-all duration-200"
            [ngClass]="{
              'bg-emerald-500/15 border-emerald-500/40 text-emerald-200': lastResult()?.status === 'SUCCESS',
              'bg-rose-500/15 border-rose-500/40 text-rose-200': lastResult()?.status === 'ALREADY_USED',
              'bg-amber-500/15 border-amber-500/40 text-amber-200': lastResult()?.status === 'INVALID' || lastResult()?.status === 'WRONG_EVENT'
            }">
            <div class="flex items-start gap-4">
              <span class="text-3xl shrink-0">
                {{ lastResult()?.status === 'SUCCESS' ? '✅' : (lastResult()?.status === 'ALREADY_USED' ? '🚨' : '⚠️') }}
              </span>
              <div class="space-y-2 flex-1">
                <h3 class="text-lg font-extrabold tracking-tight">
                  {{ lastResult()?.message }}
                </h3>

                @if (lastResult()?.ticketCode) {
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs border-t border-white/10">
                    <div>
                      <span class="opacity-60 block">Mã vé:</span>
                      <span class="font-mono font-bold">{{ lastResult()?.ticketCode }}</span>
                    </div>
                    <div>
                      <span class="opacity-60 block">Vị trí ghế:</span>
                      <span class="font-bold">{{ lastResult()?.seatLabel }}</span>
                    </div>
                    <div>
                      <span class="opacity-60 block">Hạng vé:</span>
                      <span class="font-bold">{{ lastResult()?.tierName }}</span>
                    </div>
                    <div>
                      <span class="opacity-60 block">Khách hàng:</span>
                      <span class="font-bold">{{ lastResult()?.customerName }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class StaffScannerComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly verifying = signal(false);
  readonly syncing = signal(false);
  readonly lastResult = signal<CheckInResult | null>(null);
  readonly stats = signal<CheckInStats | null>(null);
  readonly offlineCount = signal(0);

  // Default sample event ID or dynamically fetched
  private currentEventId: string | null = null;

  readonly scanForm = this.fb.group({
    qrInput: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.loadEventStats();
    this.checkLocalOfflineStorage();
  }

  private loadEventStats(): void {
    this.api.get<Array<{ id: string }>>('events').subscribe({
      next: res => {
        if (res.success && res.data && res.data.length > 0) {
          this.currentEventId = res.data[0].id;
          this.api.get<CheckInStats>(`check-in/stats/${this.currentEventId}`).subscribe({
            next: statsRes => {
              if (statsRes.success && statsRes.data) {
                this.stats.set(statsRes.data);
              }
            }
          });
        }
      }
    });
  }

  private checkLocalOfflineStorage(): void {
    const cached = localStorage.getItem('offline_tickets_manifest');
    if (cached) {
      try {
        const parsed: unknown = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          this.offlineCount.set(parsed.length);
        }
      } catch {
        this.offlineCount.set(0);
      }
    }
  }

  syncOfflineManifest(): void {
    if (!this.currentEventId) return;
    this.syncing.set(true);

    this.api.get<OfflineTicket[]>(`check-in/manifest/${this.currentEventId}`).subscribe({
      next: res => {
        this.syncing.set(false);
        if (res.success && res.data) {
          localStorage.setItem('offline_tickets_manifest', JSON.stringify(res.data));
          this.offlineCount.set(res.data.length);
          alert(`Đã tải thành công ${res.data.length} vé về bộ nhớ thiết bị. Sẵn sàng chạy chế độ Offline!`);
        }
      },
      error: () => {
        this.syncing.set(false);
        alert('Không thể đồng bộ danh sách vé. Vui lòng kiểm tra lại kết nối mạng.');
      }
    });
  }

  onScanSubmit(): void {
    if (this.scanForm.invalid) return;

    const qrInput = this.scanForm.getRawValue().qrInput?.trim();
    if (!qrInput) return;

    this.verifying.set(true);
    this.lastResult.set(null);

    this.api.post<CheckInResult>('check-in/scan', {
      qrCodeString: qrInput,
      eventId: this.currentEventId || undefined
    }).subscribe({
      next: res => {
        this.verifying.set(false);
        if (res.success && res.data) {
          this.lastResult.set(res.data);
          this.scanForm.reset();
          if (this.currentEventId) {
            this.api.get<CheckInStats>(`check-in/stats/${this.currentEventId}`).subscribe({
              next: s => { if (s.success && s.data) this.stats.set(s.data); }
            });
          }
        }
      },
      error: err => {
        this.verifying.set(false);
        this.lastResult.set({
          status: 'INVALID',
          message: err.message || 'Lỗi kết nối máy chủ soát vé.'
        });
      }
    });
  }
}
