/**
 * Lumina Transit - Incident & Complaint Reporting View
 * Unified with Lumina Transit High-Contrast Glassmorphism HUD System
 */
const ComplaintsView = {
    selectedCategory: 'overcrowding',
    capturedImageBlob: null,
    cameraStream: null,
    categories: [
        { id: 'overcrowding', label: 'Overcrowding', icon: 'groups' },
        { id: 'delay', label: 'Severe Delay', icon: 'schedule' },
        { id: 'safety', label: 'Safety Hazard', icon: 'warning' },
        { id: 'cleanliness', label: 'Cleanliness', icon: 'cleaning_services' },
        { id: 'driver_behavior', label: 'Driver Issue', icon: 'airline_seat_recline_normal' },
        { id: 'other', label: 'Other Issue', icon: 'report_problem' }
    ],
    complaints: [],

    async render() {
        return `
            <div class="view-fade-in pt-[80px] px-container-margin pb-[100px] max-w-xl mx-auto space-y-4">
                <!-- Header -->
                <div class="flex justify-between items-end mb-1">
                    <div>
                        <h2 class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">Report an Incident</h2>
                        <p class="text-xs text-on-surface-variant">Continuous crowd feedback & evidence verification</p>
                    </div>
                </div>

                <!-- Incentive Banner -->
                <div class="glass-panel rounded-2xl p-4 border-l-4 border-l-secondary flex items-center gap-3.5 shadow-lg">
                    <div class="w-10 h-10 rounded-full bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary flex-shrink-0">
                        <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">verified</span>
                    </div>
                    <div>
                        <div class="font-bold text-xs text-secondary font-semibold">Earn +15 Points for Valid Reports</div>
                        <div class="text-[11px] text-on-surface-variant">Include photo evidence to expedite transit authority investigations.</div>
                    </div>
                </div>

                <!-- Step 1: Category Selection -->
                <div class="glass-panel rounded-2xl p-4 shadow-lg">
                    <label class="block font-label-bold text-xs text-on-surface font-semibold mb-3">1. Select Incident Category</label>
                    <div class="grid grid-cols-3 gap-2" id="complaint-categories-grid">
                        ${this.categories.map(cat => `
                            <button 
                                type="button"
                                class="p-3 rounded-xl border ${this.selectedCategory === cat.id ? 'border-primary bg-primary/20 text-primary shadow-[0_0_12px_rgba(173,198,255,0.25)]' : 'border-white/10 bg-surface-container/60 text-on-surface-variant hover:bg-surface-container-high'} flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer"
                                onclick="ComplaintsView.selectCategory('${cat.id}')"
                            >
                                <span class="material-symbols-outlined text-2xl">${cat.icon}</span>
                                <span class="font-label-sm text-[11px] font-medium leading-tight">${cat.label}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Step 2: Form & Camera Evidence -->
                <div class="glass-panel rounded-2xl p-4 shadow-lg space-y-3.5">
                    <div>
                        <label class="block font-label-bold text-xs text-on-surface font-semibold mb-1.5">2. Incident Description</label>
                        <textarea 
                            id="complaint-description" 
                            rows="3" 
                            class="w-full p-3 glass-panel rounded-xl text-body-md text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary border border-white/10"
                            placeholder="Describe what happened (e.g. Bus #WP-ND-4521 dangerously packed with open doors at Bambalapitiya)"
                            required
                        ></textarea>
                    </div>

                    <div>
                        <label class="block font-label-bold text-xs text-on-surface font-semibold mb-1.5">3. Severity Level</label>
                        <select 
                            id="complaint-severity" 
                            class="w-full p-2.5 glass-panel rounded-xl text-xs text-on-surface border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary bg-surface-container"
                        >
                            <option value="low">Low - Minor Inconvenience</option>
                            <option value="medium" selected>Medium - Significant Discomfort</option>
                            <option value="high">High - Dangerous Overcrowding</option>
                            <option value="critical">Critical - Immediate Safety Risk</option>
                        </select>
                    </div>

                    <!-- In-app Camera Evidence -->
                    <div>
                        <label class="block font-label-bold text-xs text-on-surface font-semibold mb-1.5">4. Evidence (Photo or Camera)</label>
                        
                        <!-- Camera Stream Container -->
                        <div id="camera-container" class="relative rounded-xl overflow-hidden bg-black mb-2" style="display: none;">
                            <video id="camera-video" autoplay playsinline class="w-full h-48 object-cover"></video>
                            <button 
                                type="button" 
                                class="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-lg"
                                onclick="ComplaintsView.capturePhoto()"
                            >
                                <span class="material-symbols-outlined text-sm">photo_camera</span> Snap Photo
                            </button>
                        </div>

                        <!-- Photo Preview Container -->
                        <div id="photo-preview-container" class="relative rounded-xl overflow-hidden mb-2" style="display: none;">
                            <img id="photo-preview" src="" class="w-full h-40 object-cover rounded-xl border border-white/20">
                            <button 
                                type="button" 
                                class="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-black"
                                onclick="ComplaintsView.removePhoto()"
                            >
                                <span class="material-symbols-outlined text-base">delete</span>
                            </button>
                        </div>

                        <div class="flex gap-2">
                            <button 
                                type="button" 
                                class="flex-1 py-2.5 rounded-xl border border-primary/30 bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-primary/20 transition-all active:scale-95"
                                onclick="ComplaintsView.startCamera()"
                            >
                                <span class="material-symbols-outlined text-base">photo_camera</span> Open Camera
                            </button>

                            <label class="flex-1 py-2.5 rounded-xl border border-white/15 bg-surface-container text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-all active:scale-95 cursor-pointer">
                                <span class="material-symbols-outlined text-base text-tertiary">upload_file</span> Upload Photo
                                <input type="file" id="complaint-file-input" accept="image/*" class="hidden" onchange="ComplaintsView.handleFileUpload(event)">
                            </label>
                        </div>
                    </div>

                    <button 
                        type="button" 
                        id="submit-complaint-btn"
                        class="w-full py-3.5 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary-fixed active:scale-[0.98] transition-all shadow-lg shadow-primary/25 mt-2"
                        onclick="ComplaintsView.submitReport()"
                    >
                        <span class="material-symbols-outlined text-base">send</span> Submit Report (+15 Pts)
                    </button>
                </div>

                <!-- Past Submitted Reports -->
                <div class="glass-panel rounded-2xl p-4 shadow-lg">
                    <h3 class="font-headline-md text-xs font-bold text-on-surface mb-3 flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-primary text-base">history</span>
                        My Incident History
                    </h3>
                    <div id="past-complaints-list" class="space-y-2">
                        <div class="text-xs text-on-surface-variant text-center py-2">Loading past reports...</div>
                    </div>
                </div>
            </div>
        `;
    },

    async init() {
        if (API.isAuthenticated()) {
            await this.loadPastComplaints();
        } else {
            const list = document.getElementById('past-complaints-list');
            if (list) list.innerHTML = `<div class="text-xs text-on-surface-variant text-center py-2">Sign in to view your submission history.</div>`;
        }
    },

    destroy() {
        this.stopCamera();
    },

    selectCategory(catId) {
        this.selectedCategory = catId;
        const grid = document.getElementById('complaint-categories-grid');
        if (!grid) return;

        grid.querySelectorAll('button').forEach(btn => {
            btn.className = 'p-3 rounded-xl border border-white/10 bg-surface-container/60 text-on-surface-variant hover:bg-surface-container-high flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer';
        });

        const selectedBtn = Array.from(grid.querySelectorAll('button')).find(b => b.getAttribute('onclick').includes(catId));
        if (selectedBtn) {
            selectedBtn.className = 'p-3 rounded-xl border border-primary bg-primary/20 text-primary shadow-[0_0_12px_rgba(173,198,255,0.25)] flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer';
        }
    },

    async startCamera() {
        const container = document.getElementById('camera-container');
        const video = document.getElementById('camera-video');

        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                this.cameraStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                video.srcObject = this.cameraStream;
                container.style.display = 'block';
            } else {
                NotificationUtils.showToast('Camera Unavailable', 'Please use photo upload', 'info');
            }
        } catch (err) {
            NotificationUtils.showToast('Camera Permission Denied', 'Please upload a photo instead', 'warning');
        }
    },

    capturePhoto() {
        const video = document.getElementById('camera-video');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            this.capturedImageBlob = blob;
            const previewUrl = URL.createObjectURL(blob);
            this.showPreview(previewUrl);
            this.stopCamera();
        }, 'image/jpeg', 0.85);
    },

    stopCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(t => t.stop());
            this.cameraStream = null;
        }
        const container = document.getElementById('camera-container');
        if (container) container.style.display = 'none';
    },

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            this.capturedImageBlob = file;
            const previewUrl = URL.createObjectURL(file);
            this.showPreview(previewUrl);
        }
    },

    showPreview(url) {
        const previewContainer = document.getElementById('photo-preview-container');
        const previewImg = document.getElementById('photo-preview');
        if (previewContainer && previewImg) {
            previewImg.src = url;
            previewContainer.style.display = 'block';
        }
    },

    removePhoto() {
        this.capturedImageBlob = null;
        const previewContainer = document.getElementById('photo-preview-container');
        if (previewContainer) previewContainer.style.display = 'none';
    },

    async submitReport() {
        if (!API.isAuthenticated()) {
            window.app.showAuthModal();
            return;
        }

        const description = document.getElementById('complaint-description')?.value.trim();
        const severity = document.getElementById('complaint-severity')?.value || 'medium';
        const submitBtn = document.getElementById('submit-complaint-btn');

        if (!description) {
            NotificationUtils.showToast('Description Required', 'Please describe the incident', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('category', this.selectedCategory);
        formData.append('description', description);
        formData.append('severity', severity);

        if (this.capturedImageBlob) {
            formData.append('image', this.capturedImageBlob, 'evidence.jpg');
        }

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-sm">sync</span> Submitting...`;

            await API.submitComplaint(formData);

            NotificationUtils.showToast(
                'Report Submitted!',
                'Earned +15 Points. Transit operators notified for investigation.',
                'success'
            );

            // Reset form
            document.getElementById('complaint-description').value = '';
            this.removePhoto();
            await this.loadPastComplaints();
            window.app.updateSidebarUser();
        } catch (e) {
            NotificationUtils.showToast('Submission Failed', e.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span class="material-symbols-outlined text-base">send</span> Submit Report (+15 Pts)`;
        }
    },

    async loadPastComplaints() {
        const list = document.getElementById('past-complaints-list');
        if (!list) return;

        try {
            const res = await API.getComplaints();
            this.complaints = res.complaints || [];

            if (this.complaints.length === 0) {
                list.innerHTML = `<div class="text-on-surface-variant text-xs text-center py-2">No incidents reported yet.</div>`;
                return;
            }

            list.innerHTML = this.complaints.map(c => `
                <div class="p-3 rounded-xl bg-surface-container flex items-center justify-between border border-white/5 shadow-sm">
                    <div>
                        <div class="font-bold text-xs text-on-surface capitalize">${c.category.replace('_', ' ')} • <span class="text-on-surface-variant text-[11px] font-normal">${new Date(c.created_at).toLocaleDateString()}</span></div>
                        <div class="text-xs text-on-surface-variant truncate max-w-[200px] mt-0.5">${c.description}</div>
                    </div>
                    <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${c.status === 'resolved' ? 'bg-secondary/20 text-secondary border border-secondary/30' : 'bg-tertiary/20 text-tertiary border border-tertiary/30'}">
                        ${c.status}
                    </span>
                </div>
            `).join('');
        } catch (e) {}
    }
};
