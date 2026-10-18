import Swal from 'sweetalert2';

// SweetAlert2 dialogs from the live courses.php / course_details.php scripts.

/** Resolves true when the visitor chooses "Login Now". */
export async function loginRequired(text = 'Please login to view course videos'): Promise<boolean> {
  const result = await Swal.fire({
    icon: 'warning',
    title: 'Login Required',
    text,
    confirmButtonText: 'Login Now',
    showCancelButton: true,
    cancelButtonText: 'Cancel',
  });
  return result.isConfirmed;
}

/** Locked video. Resolves true on "Purchase Now". */
export async function purchaseRequired(priceText: string, videoCount: number): Promise<boolean> {
  const result = await Swal.fire({
    icon: 'warning',
    title: 'Purchase Required!',
    html:
      '<div style="text-align: left;">' +
      '<strong>Premium Video Locked 🔒</strong><br><br>' +
      '📹 This video requires course purchase<br>' +
      `🎬 Unlock all ${videoCount} videos in this course<br>` +
      '✅ Lifetime access after purchase<br>' +
      '⏰ Instant access after payment approval<br>' +
      `💰 Only ${priceText}` +
      '</div>',
    confirmButtonText: 'Purchase Now',
    showCancelButton: true,
    cancelButtonText: 'Watch Free Videos',
    confirmButtonColor: '#28a745',
    width: '500px',
  });
  return result.isConfirmed;
}

/** "Buy Now" confirmation on course_details.php. */
export async function confirmPurchase(title: string, priceText: string, videoCount: number): Promise<boolean> {
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const result = await Swal.fire({
    title: 'Confirm Purchase',
    html: `<div style="text-align: left;">
      <h4 style="color: #2c3e50;">${esc(title)}</h4>
      <p>You're about to purchase this course for <strong style="color: #e74c3c;">${esc(priceText)}</strong></p>
      <div style="display: flex; align-items: center; gap: 10px; margin: 10px 0;"><i class="fa fa-check text-success"></i><span>Full lifetime access</span></div>
      <div style="display: flex; align-items: center; gap: 10px; margin: 10px 0;"><i class="fa fa-check text-success"></i><span>Certificate of completion</span></div>
      <div style="display: flex; align-items: center; gap: 10px; margin: 10px 0;"><i class="fa fa-check text-success"></i><span>All ${videoCount} videos</span></div>
      </div>`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Proceed to Payment',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#28a745',
    width: '500px',
  });
  return result.isConfirmed;
}
