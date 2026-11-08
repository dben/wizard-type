import { CreateScreen } from '../ui/screens/CreateScreen';
import { LessonScreen } from '../ui/screens/LessonScreen';
import { MapScreen } from '../ui/screens/MapScreen';
import { ProfilesScreen } from '../ui/screens/ProfilesScreen';
import { RoomScreen } from '../ui/screens/RoomScreen';
import { ShopScreen } from '../ui/screens/ShopScreen';
import { WardrobeScreen } from '../ui/screens/WardrobeScreen';
import { TopBar } from '../ui/components/TopBar';
import { currentProfile, useGame } from './store';

export function App() {
  const { screen } = useGame();
  const p = currentProfile();
  if (!p && screen.name !== 'create') return <ProfilesScreen />;
  switch (screen.name) {
    case 'profiles':
      return <ProfilesScreen />;
    case 'create':
      return <CreateScreen editing={screen.editing} />;
    case 'lesson':
      return <LessonScreen lessonId={screen.lessonId} />;
    default:
      return (
        <>
          <TopBar />
          {screen.name === 'map' && <MapScreen />}
          {screen.name === 'room' && <RoomScreen />}
          {screen.name === 'wardrobe' && <WardrobeScreen />}
          {screen.name === 'shop' && <ShopScreen />}
        </>
      );
  }
}
