// Sample confession content. Each line is spoken aloud by the user.

export const confessions = {
  'new-week': {
    id: 'new-week',
    title: 'New Week Confession',
    theme: 'New Week Confession',
    lines: [
      { text: 'I am what the word says I am.' },
      { text: 'I can do what the word says I can do, and I have what the word says I have' },
      { text: 'The path of Obianuju shines brighter and brighter everyday.' },
      { text: 'I am not without help in this world.' },
      { text: 'I expect creative miracles in my life today' },
      { text: 'I am blessed in the morning, blessed in the noon time, and blessed in the night. The lord has anointed me to do great things.' },
      { text: 'In my work, in my ministry, in my nation, in my career.' },
      { text: 'I carry the evidence of the Lord everyday. The lord is ordering my steps to do of his good pleasure and will.' },
    ],
  },
  faith: {
    id: 'faith',
    theme: 'Faith',
    lines: [
      { text: 'I am a child of God, born of His Spirit.', ref: 'John 1:12–13' },
      { text: 'His Word is a lamp to my feet and a light to my path.', ref: 'Psalm 119:105' },
      { text: 'I walk by faith, and not by sight.', ref: '2 Corinthians 5:7' },
      { text: 'Faith comes by hearing, and hearing by the Word of God.', ref: 'Romans 10:17' },
      { text: 'I can do all things through Christ who strengthens me.', ref: 'Philippians 4:13' },
      { text: 'No weapon formed against me shall prosper.', ref: 'Isaiah 54:17' },
      { text: 'The Lord is my shepherd; I shall not want.', ref: 'Psalm 23:1' },
      { text: 'I am more than a conqueror through Him who loves me.', ref: 'Romans 8:37' },
      { text: 'Greater is He that is in me than he that is in the world.', ref: '1 John 4:4' },
      { text: 'I believe, and therefore I speak.', ref: '2 Corinthians 4:13' },
      { text: 'Today I choose to trust God with all my heart.', ref: 'Proverbs 3:5' },
      { text: 'In Jesus’ name. Amen.' },
    ],
  },
  peace: {
    id: 'peace',
    theme: 'Peace',
    lines: [
      { text: 'The peace of God guards my heart and my mind in Christ Jesus.', ref: 'Philippians 4:7' },
      { text: 'I will not be anxious about anything.', ref: 'Philippians 4:6' },
      { text: 'I cast all my care upon Him, for He cares for me.', ref: '1 Peter 5:7' },
      { text: 'He keeps me in perfect peace, because my mind is stayed on Him.', ref: 'Isaiah 26:3' },
      { text: 'My heart is not troubled, and I am not afraid.', ref: 'John 14:27' },
      { text: 'I lie down and sleep in peace, for the Lord makes me dwell in safety.', ref: 'Psalm 4:8' },
      { text: 'I am still, and I know that He is God.', ref: 'Psalm 46:10' },
      { text: 'In Jesus’ name. Amen.' },
    ],
  },
  healing: {
    id: 'healing',
    theme: 'Healing',
    lines: [
      { text: 'By His stripes I am healed.', ref: 'Isaiah 53:5' },
      { text: 'Jesus Himself took my infirmities and bore my sicknesses.', ref: 'Matthew 8:17' },
      { text: 'He forgives all my sins and heals all my diseases.', ref: 'Psalm 103:3' },
      { text: 'He sent His Word and healed me.', ref: 'Psalm 107:20' },
      { text: 'The Spirit that raised Christ from the dead gives life to my body.', ref: 'Romans 8:11' },
      { text: 'I shall not die, but live, and declare the works of the Lord.', ref: 'Psalm 118:17' },
      { text: 'I am strong in the Lord and in the power of His might.', ref: 'Ephesians 6:10' },
      { text: 'In Jesus’ name. Amen.' },
    ],
  },
};

export function getConfession(id) {
  return confessions[id] ?? confessions['new-week'];
}
