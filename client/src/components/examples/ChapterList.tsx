// import ChapterList from '../ChapterList';

// export default function ChapterListExample() {
//   const chapters = [
//     { id: 1, title: 'Les Salutations', description: 'Greetings and introductions' },
//     { id: 2, title: 'Les Nombres', description: 'Numbers and counting' },
//     { id: 3, title: 'La Famille', description: 'Family members and relationships' },
//   ];

//   return (
//     <div className="p-8 bg-background">
//       <ChapterList
//         chapters={chapters}
//         onSelect={(id) => console.log('Selected chapter:', id)}
//       />
//     </div>
//   );
// }

// import ChapterList from '../ChapterList';

// export default function ChapterListExample() {
//   const chapters = [
//     { id: 1, title: 'Les Salutations', description: 'Greetings and introductions' },
//     { id: 2, title: 'Les Nombres', description: 'Numbers and counting' },
//     { id: 3, title: 'La Famille', description: 'Family members and relationships' },
//   ];

//   return (
//     <div className="p-8 bg-background">
//       <ChapterList
//         chapters={chapters}
//         onSelect={(id) => console.log('Selected chapter:', id)}
//       />
//     </div>
//   );
// }


import ChapterList from "../ChapterList";

export default function ChapterListExample() {
  const chapters = [
    {
      id: 1,
      title: {
        english: "Les Salutations",
        hindi: "लेस सल्यूटेशन्स",
      },
      description: {
        english: "Greetings and introductions",
        hindi: "अभिवादन और परिचय",
      },
    },
    {
      id: 2,
      title: {
        english: "Les Nombres",
        hindi: "संख्याएँ",
      },
      description: {
        english: "Numbers and counting",
        hindi: "संख्याएँ और गिनती",
      },
    },
    {
      id: 3,
      title: {
        english: "La Famille",
        hindi: "ला फमीय",
      },
      description: {
        english: "Family members and relationships",
        hindi: "परिवार के सदस्य और संबंध",
      },
    },
  ];

  return (
    <div className="p-8 bg-background">
      <ChapterList
        chapters={chapters}
        onSelect={(id) => console.log("Selected chapter:", id)}
        selectedMedium="english"   // 👈 REQUIRED PROP
      />
    </div>
  );
}