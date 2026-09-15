import type { PhraseCategory } from '@/types';

export const _phrases = [
  { cat: 'Greetings', items: [
    { jp: 'こんにちは', rom: 'Konnichiwa', en: 'Hello / Good afternoon' },
    { jp: 'おはようございます', rom: 'Ohayō gozaimasu', en: 'Good morning' },
    { jp: 'こんばんは', rom: 'Konbanwa', en: 'Good evening' },
    { jp: 'ありがとうございます', rom: 'Arigatō gozaimasu', en: 'Thank you very much' },
    { jp: 'すみません', rom: 'Sumimasen', en: 'Excuse me / Sorry' },
    { jp: 'よろしくおねがいします', rom: 'Yoroshiku onegaishimasu', en: 'Nice to meet you / Please treat me well' },
  ]},
  { cat: 'Getting Around', items: [
    { jp: '〜はどこですか？', rom: '〜 wa doko desu ka?', en: 'Where is 〜?' },
    { jp: '〜までいくらですか？', rom: '〜 made ikura desu ka?', en: 'How much to 〜?' },
    { jp: 'つぎのえきはなんですか？', rom: 'Tsugi no eki wa nan desu ka?', en: 'What is the next station?' },
    { jp: 'のりばはどこですか？', rom: 'Noriba wa doko desu ka?', en: 'Where is the boarding area?' },
    { jp: 'ちかてつのきっぷをください', rom: 'Chikatetsu no kippu o kudasai', en: 'One subway ticket, please' },
    { jp: 'みぎ / ひだり / まっすぐ', rom: 'Migi / Hidari / Massugu', en: 'Right / Left / Straight ahead' },
  ]},
  { cat: 'Food & Drink', items: [
    { jp: 'いただきます', rom: 'Itadakimasu', en: "Said before eating — always say this" },
    { jp: 'ごちそうさまでした', rom: 'Gochisōsama deshita', en: 'Said after eating — thank the chef/host' },
    { jp: 'かんぱい！', rom: 'Kanpai!', en: 'Cheers!' },
    { jp: 'おいしい！', rom: 'Oishii!', en: 'Delicious!' },
    { jp: 'これをください', rom: 'Kore o kudasai', en: "I'll have this, please (point at menu)" },
    { jp: 'おすすめはなんですか？', rom: 'Osusume wa nan desu ka?', en: 'What do you recommend?' },
    { jp: 'おかわりをください', rom: 'Okawari o kudasai', en: 'One more / same again, please' },
    { jp: 'おかんじょうをください', rom: 'Okanjō o kudasai', en: 'The bill, please' },
    { jp: 'アレルギーがあります', rom: 'Arerugī ga arimasu', en: 'I have an allergy' },
    { jp: 'みずをください', rom: 'Mizu o kudasai', en: 'Water, please' },
    { jp: 'ふたりです', rom: 'Futari desu', en: 'Two people (when being seated)' },
    { jp: 'よやくをしています。なまえは〜です', rom: 'Yoyaku o shite imasu. Namae wa 〜 desu', en: 'I have a reservation. My name is 〜' },
  ]},
  { cat: 'Ordering & Bars', items: [
    { jp: 'おまかせでおねがいします', rom: 'Omakase de onegaishimasu', en: "Chef's choice — leave it to you" },
    { jp: 'ビールをふたつください', rom: 'Bīru o futatsu kudasai', en: 'Two beers, please' },
    { jp: 'なまビールをふたつください', rom: 'Nama bīru o futatsu kudasai', en: 'Two draft beers, please' },
    { jp: 'カクテルをふたつください', rom: 'Kakuteru o futatsu kudasai', en: 'Two cocktails, please' },
    { jp: 'ウイスキーをふたつください', rom: 'Uisukī o futatsu kudasai', en: 'Two whiskies, please' },
    { jp: 'おなじものをもうふたつください', rom: 'Onaji mono o mō futatsu kudasai', en: 'Two more of the same, please' },
    { jp: 'なんでもおまかせします', rom: 'Nan demo omakase shimasu', en: 'Anything — I trust your judgment completely' },
    { jp: 'カクテルはなにがありますか？', rom: 'Kakuteru wa nani ga arimasu ka?', en: 'What cocktails do you have?' },
    { jp: 'さっぱりしたものをおねがいします', rom: 'Sappari shita mono o onegaishimasu', en: 'Something light and refreshing, please' },
    { jp: 'つよいものをおねがいします', rom: 'Tsuyoi mono o onegaishimasu', en: 'Something strong, please' },
    { jp: 'このウイスキーをすいせんしてください', rom: 'Kono uisukī o suisen shite kudasai', en: 'Please recommend a whisky' },
    { jp: 'ソースのニヅケはしません', rom: 'Sōsu no nijuke wa shimasen', en: "No double-dipping the sauce (Kushikatsu Daruma rule)" },
    { jp: 'カウンターせきをおねがいします', rom: 'Kauntā seki o onegaishimasu', en: 'Counter seat, please' },
    { jp: 'ノンアルコールはありますか？', rom: 'Non-arukōru wa arimasu ka?', en: 'Do you have non-alcoholic options?' },
  ]},
  { cat: 'Shopping', items: [
    { jp: 'いくらですか？', rom: 'Ikura desu ka?', en: 'How much is this?' },
    { jp: 'これをみせてください', rom: 'Kore o misete kudasai', en: 'Please show me this' },
    { jp: 'ちょっとたかいです', rom: 'Chotto takai desu', en: "It's a little expensive" },
    { jp: 'クレジットカードはつかえますか？', rom: 'Kurejitto kādo wa tsukaemasu ka?', en: 'Do you accept credit cards?' },
    { jp: 'ふくろはいりません', rom: 'Fukuro wa irimasen', en: "I don't need a bag" },
    { jp: 'まけてください', rom: 'Makete kudasai', en: 'Can you give me a discount?' },
  ]},
  { cat: 'Polite & Social', items: [
    { jp: 'わかりません', rom: 'Wakarimasen', en: "I don't understand" },
    { jp: 'にほんごがわかりません', rom: 'Nihongo ga wakarimasen', en: "I don't speak Japanese" },
    { jp: 'えいごはわかりますか？', rom: 'Eigo wa wakarimasu ka?', en: 'Do you speak English?' },
    { jp: 'もういちどおねがいします', rom: 'Mō ichido onegaishimasu', en: 'Please say that again' },
    { jp: 'ゆっくりはなしてください', rom: 'Yukkuri hanashite kudasai', en: 'Please speak slowly' },
    { jp: 'しゃしんをとってもいいですか？', rom: 'Shashin o totte mo ii desu ka?', en: 'May I take a photo?' },
  ]},
  { cat: 'Emergency', items: [
    { jp: 'たすけてください！', rom: 'Tasukete kudasai!', en: 'Help me, please!' },
    { jp: 'びょういんはどこですか？', rom: 'Byōin wa doko desu ka?', en: 'Where is the hospital?' },
    { jp: 'けいさつをよんでください', rom: 'Keisatsu o yonde kudasai', en: 'Please call the police' },
    { jp: 'きゅうきゅうしゃをよんでください', rom: 'Kyūkyūsha o yonde kudasai', en: 'Please call an ambulance' },
    { jp: 'パスポートをなくしました', rom: 'Pasupōto o nakushimashita', en: 'I lost my passport' },
    { jp: 'ぐあいがわるいです', rom: 'Guai ga warui desu', en: 'I feel sick' },
  ]},
];

export const _speak = (text: string) => {
  const synth = window.speechSynthesis;
  if (!synth) return;
  const fire = (voices: SpeechSynthesisVoice[]) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = 0.82;
    u.pitch = 1.05;
    const jaVoices = voices.filter(v => v.lang.startsWith('ja'));
    const preferred = jaVoices.find(v => /google/i.test(v.name))
      ?? jaVoices.find(v => /enhanced|premium|neural|natural/i.test(v.name))
      ?? jaVoices[0]
      ?? null;
    if (preferred) u.voice = preferred;
    synth.cancel();
    synth.speak(u);
  };
  const voices = synth.getVoices();
  if (voices.length) fire(voices);
  else { synth.onvoiceschanged = () => fire(synth.getVoices()); }
};
