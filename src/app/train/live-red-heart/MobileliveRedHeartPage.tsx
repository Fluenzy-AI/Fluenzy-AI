'use client';

import MobileliveGDPage from '../live-gd/MobileliveGDPage';

export default function MobileliveRedHeartPage() {
  return (
    <MobileliveGDPage
      fixedParticipantCount={2}
      labelTitle="HeartSync"
      labelSubtitle="Connect randomly and share your thoughts face-to-face"
      labelSectionSetup="HeartSync Setup"
      labelConfigure="Find Someone to Talk To"
      labelParticipants="Connection"
      labelParticipantFixed="1-on-1 Video Chat"
      redirectOnEnd="/train/live-red-heart"
    />
  );
}
