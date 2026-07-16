const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'public', 'voice-samples');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Minimal valid silent MP3 frame base64 (approx 1 second of silence)
const silentMp3Base64 = 
  'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGFtZTMuOTguNFVVVVVVVVVVVVVVV' +
  'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV' +
  'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV' +
  'VVVVVVV//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQC' +
  'AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg' +
  'ICA//uQyAAAAAAAAAAAAAAAAAAAAAAABGSUxFAAAAeAAAAAAA//uQyAAAA' +
  'AAAAAAAAAAAAAAAAAAABGSUxFAAAAeAAAAAAA//uQyAAAAAAAAAAAAAAAA' +
  'AAAAAAABGSUxFAAAAeAAAAAAA//uQyAAAAAAAAAAAAAAAAAAAAAAABGSUx' +
  'FAAAAeAAAAAAA';

const buffer = Buffer.from(silentMp3Base64, 'base64');

const voices = ['priya', 'arjun', 'sarah', 'marcus'];
voices.forEach(voice => {
  const filePath = path.join(dir, `${voice}.mp3`);
  fs.writeFileSync(filePath, buffer);
  console.log(`Created sample for ${voice} at ${filePath}`);
});
console.log('Voice sample assets initialized.');
