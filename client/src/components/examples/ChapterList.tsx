import ChapterList from '../ChapterList';

export default function ChapterListExample() {
  const chapters = [
    { id: 1, title: 'Les Salutations', description: 'Greetings and introductions' },
    { id: 2, title: 'Les Nombres', description: 'Numbers and counting' },
    { id: 3, title: 'La Famille', description: 'Family members and relationships' },
  ];

  return (
    <div className="p-8 bg-background">
      <ChapterList
        chapters={chapters}
        onSelect={(id) => console.log('Selected chapter:', id)}
      />
    </div>
  );
}
