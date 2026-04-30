
// RESET ANIMATIONS SCRIPT
// Run this in browser console (F12) to see all animations again

console.log('🔄 Resetting all animations...');

// Clear all animation flags
localStorage.removeItem('dashboard_book_intro_seen');
localStorage.removeItem('trade_card_deck_seen');

console.log('✅ Animation flags cleared!');
console.log('🔄 Reloading page...');

// Reload page
setTimeout(() => {
    location.reload();
}, 500);
