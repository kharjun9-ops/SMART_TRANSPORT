/**
 * Lumina Transit - High Precision GPS & Anti-Fraud Telemetry Verification Client
 */
const GPSUtils = {
    // Demo simulation toggle for hackathon presentation / testing
    isDemoMode() {
        return localStorage.getItem('transitiq_demo_mode') === 'true';
    },

    setDemoMode(enabled) {
        localStorage.setItem('transitiq_demo_mode', enabled ? 'true' : 'false');
    },

    /**
     * Acquire high-accuracy device GPS coordinates
     */
    async getCurrentPosition() {
        if (this.isDemoMode()) {
            return {
                latitude: 12.9778 + (Math.random() * 0.0004 - 0.0002),
                longitude: 77.5726 + (Math.random() * 0.0004 - 0.0002),
                accuracy: 10,
                isDemo: true,
                source: 'Demo Geofence Simulator'
            };
        }

        if (!navigator.geolocation) {
            return { latitude: null, longitude: null, isDemo: false, error: 'Geolocation not supported by device' };
        }

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    resolve({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                        isDemo: false,
                        source: 'Live Satellite GPS'
                    });
                },
                (err) => {
                    console.warn('GPS Acquisition notice:', err.message);
                    resolve({
                        latitude: null,
                        longitude: null,
                        isDemo: false,
                        error: err.message
                    });
                },
                {
                    enableHighAccuracy: true,
                    timeout: 8000,
                    maximumAge: 0
                }
            );
        });
    },

    /**
     * Show interactive verification result modal with full telemetry breakdown
     */
    showVerificationResultModal(result, actionName = 'Check-in') {
        const isVerified = result.verified || result.status === 'verified';
        const isPending = result.status === 'pending';
        const isRejected = result.status === 'rejected' || !isVerified;

        let statusIcon = 'check_circle';
        let statusTitle = 'Verification Successful!';
        let statusColor = 'text-secondary';
        let statusBg = 'bg-secondary/15 border-secondary/30';

        if (isRejected) {
            statusIcon = 'cancel';
            statusTitle = 'Verification Failed';
            statusColor = 'text-error';
            statusBg = 'bg-error/15 border-error/30';
        } else if (isPending) {
            statusIcon = 'hourglass_top';
            statusTitle = 'Verification Pending';
            statusColor = 'text-tertiary';
            statusBg = 'bg-tertiary/15 border-tertiary/30';
        }

        const checks = result.verification?.checks || [];
        const distanceStop = result.verification?.distanceToStopMeters;
        const distanceBus = result.verification?.distanceToBusMeters;
        const confidence = Math.round((result.verification?.confidence || 0.5) * 100);

        window.app.showModal(`
            <div class="glass-panel rounded-2xl p-5 max-w-md mx-auto shadow-2xl border border-white/15 relative overflow-hidden space-y-4">
                <!-- Header Status -->
                <div class="flex items-center gap-3 p-3 rounded-xl border ${statusBg}">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center ${statusColor} bg-surface-container shrink-0">
                        <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">${statusIcon}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="font-bold text-sm ${statusColor}">${statusTitle}</h3>
                        <p class="text-[11px] text-on-surface-variant leading-tight">${result.message || (isVerified ? 'Location & telemetry verified within perimeter.' : 'Integrity check failed.')}</p>
                    </div>
                    <button class="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-on-surface-variant" onclick="window.app.closeModal()">
                        <span class="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                <!-- Points & Confidence Banner -->
                <div class="grid grid-cols-2 gap-2 text-center">
                    <div class="bg-surface-container/70 rounded-xl p-2.5 border border-white/10">
                        <span class="text-[10px] text-on-surface-variant uppercase font-semibold">Points Outcome</span>
                        <div class="font-status-number text-lg font-bold ${result.points > 0 ? 'text-primary' : 'text-outline'} mt-0.5">
                            ${result.points > 0 ? `+${result.points} Pts` : (result.pendingPoints > 0 ? `+${result.pendingPoints} (Held)` : '0 Pts (Withheld)')}
                        </div>
                    </div>
                    <div class="bg-surface-container/70 rounded-xl p-2.5 border border-white/10">
                        <span class="text-[10px] text-on-surface-variant uppercase font-semibold">Confidence Rating</span>
                        <div class="font-status-number text-lg font-bold ${confidence >= 70 ? 'text-secondary' : (confidence >= 40 ? 'text-tertiary' : 'text-error')} mt-0.5">
                            ${confidence}%
                        </div>
                    </div>
                </div>

                <!-- Telemetry Check Breakdown -->
                <div class="space-y-1.5 bg-surface-container-low/80 rounded-xl p-3 border border-white/5 text-xs">
                    <h4 class="font-bold text-[11px] text-on-surface uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>Multi-Point Integrity Check</span>
                        <span class="text-[10px] text-on-surface-variant font-normal">Perimeter: 350m</span>
                    </h4>

                    <!-- Stop Distance -->
                    <div class="flex items-center justify-between py-1 border-b border-white/5 text-[11px]">
                        <span class="text-on-surface-variant flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-xs text-primary">pin_drop</span>
                            Distance to Stop
                        </span>
                        <span class="font-semibold ${distanceStop !== null && distanceStop <= 350 ? 'text-secondary' : 'text-error'}">
                            ${distanceStop !== null ? `${distanceStop}m ${distanceStop <= 350 ? '✓' : '(Out of range)'}` : 'N/A'}
                        </span>
                    </div>

                    <!-- Bus Distance -->
                    <div class="flex items-center justify-between py-1 border-b border-white/5 text-[11px]">
                        <span class="text-on-surface-variant flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-xs text-primary">directions_bus</span>
                            Distance to Bus
                        </span>
                        <span class="font-semibold ${distanceBus !== null && distanceBus <= 350 ? 'text-secondary' : 'text-on-surface-variant'}">
                            ${distanceBus !== null ? `${distanceBus}m ${distanceBus <= 350 ? '✓' : ''}` : 'In Transit'}
                        </span>
                    </div>

                    <!-- Checks List -->
                    ${checks.map(c => `
                        <div class="flex items-center justify-between py-1 text-[11px]">
                            <span class="text-on-surface-variant">${c.name}</span>
                            <span class="font-bold ${c.passed ? 'text-secondary' : 'text-error'}">
                                ${c.passed ? 'PASSED ✓' : 'FAILED ✗'}
                            </span>
                        </div>
                    `).join('')}
                </div>

                <!-- Simulation Toggle Helper -->
                <div class="bg-primary/10 rounded-xl p-2.5 border border-primary/20 flex items-center justify-between text-[11px]">
                    <div class="flex items-center gap-1.5 text-on-surface-variant">
                        <span class="material-symbols-outlined text-sm text-primary">science</span>
                        <span>Testing from home?</span>
                    </div>
                    <button 
                        class="px-2 py-1 rounded-lg ${this.isDemoMode() ? 'bg-secondary/20 text-secondary border border-secondary/30' : 'bg-surface-container-high text-on-surface border border-white/10'} font-bold text-[10px] transition-all"
                        onclick="GPSUtils.toggleDemoMode()"
                    >
                        ${this.isDemoMode() ? 'Demo Geofence: ON' : 'Turn Demo Mode ON'}
                    </button>
                </div>

                <button 
                    class="w-full py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary-fixed transition-all"
                    onclick="window.app.closeModal()"
                >
                    Dismiss
                </button>
            </div>
        `);
    },

    toggleDemoMode() {
        const next = !this.isDemoMode();
        this.setDemoMode(next);
        NotificationUtils.showToast(
            next ? 'Demo Mode Active' : 'Live Satellite GPS Active',
            next ? 'Geofence simulation enabled for remote testing.' : 'Strict 350m satellite geofencing enforced.',
            next ? 'info' : 'success'
        );
        window.app.closeModal();
    }
};
