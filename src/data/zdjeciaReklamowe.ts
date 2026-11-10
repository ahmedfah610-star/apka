// Ręcznie wybrane zdjęcia do reklam Google (plik produktowy): dla droższych produktów z zapasem
// jedno czyste ujęcie (produkt na modelu albo sam komplet) zamiast kolażu kilku zdjęć.
// Dotyczy tylko pliku dla Google — zdjęcia w sklepie zostają bez zmian. Wpis działa, dopóki to
// zdjęcie jest w galerii produktu; po zmianie galerii reklama wraca do zdjęcia głównego.
// Produkty z tej listy dostają w pliku etykietę „top-zdjecie" (custom_label_4).
export const ZDJECIA_REKLAMOWE: Record<string, string> = {
  "al-m-iinab9": "https://a.allegroimg.com/original/117ce3/addb015e45eeae6369d6c23ea122", // Sweter męski rozpinany półgolf Ciepły męski swet · szary (gołębi) · 69.99 zł
  "al-m-1r03gnx": "https://a.allegroimg.com/original/117571/cda6a36048b9b1e86db766fdf7be", // Sweter męski rozpinany półgolf Ciepły z zamkiem  · szary (grafitowy) · 69.99 zł
  "al-m-1jmn6n5": "https://a.allegroimg.com/original/11115f/0efa990b4ee897d91537cfa19633", // Męski Sweter Rozpinany na Zamku Ocieplany Futerk · czarny · 65 zł
  "al-m-1ev6jyg": "https://a.allegroimg.com/original/113eda/e03dc0e44541b56fd131ba1a01c2", // Męski Sweter Rozpinany na Zamku Ocieplany Futerk · brązowy · 65 zł
  "al-m-sobcr1": "https://a.allegroimg.com/original/116d53/505e7a674a849bd861cf6c9b6545", // Sweter męski cienki półgolf z zamkiem lekki klas · szary (grafitowy) · 55 zł
  "al-m-jw7vup": "https://a.allegroimg.com/original/11cc6f/489be5654a3498637cba2df1cf91", // Sweter męski cienki półgolf z zamkiem lekki klas · niebieski (granatowy) · 55 zł
  "al-m-1d0rj3g": "https://a.allegroimg.com/original/11c108/6efe904449f889b8c5a76588dd02", // Rozpinana bluza męska z kapturem ciepła · czerwony · 53.99 zł
  "al-m-11p18iv": "https://a.allegroimg.com/original/1100b0/5db175394a129365d06d6643246f", // Bluza męska młodzieżowa biała z kapturem kangur · biały · 49.99 zł
  "al-m-19x1qug": "https://a.allegroimg.com/original/114d23/186c8d8d43af9179b2194f23f39b", // Bluza męska młodzieżowa czarna z kapturem kangur · czarny · 49.99 zł
  "al-m-1yv82pc": "https://a.allegroimg.com/original/11ef51/fdbcd28c4921a4439134d6951957", // Bluza męska młodzieżowa granat z kapturem kangur · niebieski (granatowy) · 55 zł
  "al-m-mv6adp": "https://a.allegroimg.com/original/11ce33/4063dc1b4f8ebd3eb5533d92d5b8", // Męski sweter z dekoltem v lekki ciepły elegancki · beżowy · 49.99 zł
  "al-m-1j79vns": "https://a.allegroimg.com/original/116f86/78b0e661428795876fa40ebc8dfe", // Sweter męski rozpinany półgolf klasyczny fason · niebieski (granatowy) · 49.99 zł
  "al-m-gn0pas": "https://a.allegroimg.com/original/110c11/485286e5409ea2033c5573102d77", // Sweter męski rozpinany półgolf klasyczny fason · niebieski (granatowy) · 49.99 zł
  "al-m-11kcgoy": "https://wvqxnoqqkoptwyljywju.supabase.co/storage/v1/object/public/produkty/1793456160061-Sweter-z-dzianiny-w-kolorze-taupe-1-.png", // Sweter męski rozpinany półgolf klasyczny fason · brązowy · 49.99 zł
  "al-m-1ylneqs": "https://a.allegroimg.com/original/11adfb/fbb5c0e148169faaf9ea341f1427", // Sweter męski rozpinany półgolf klasyczny fason · brązowy · 49.99 zł
  "al-m-1b2d6gw": "https://a.allegroimg.com/original/118fed/c57d41bc46f0a87c058142e1636a", // Sweter męski cienki szary półgolf z zamkiem lekk · szary · 49.99 zł
  "al-m-q8og1v": "https://a.allegroimg.com/original/114513/292353f54cca92cf528b0cdf3e6c", // Sweter męski rozpinany półgolf klasyczny fason · czarny · 49.99 zł
  "al-m-1ctdyx1": "https://a.allegroimg.com/original/11220e/7822e66841b6ba12815523351cf5", // Bluza męska młodzieżowa bez kaptura Baseball Col · biały · 49.99 zł
  "al-m-1ww7sbs": "https://a.allegroimg.com/original/11e12e/ea91b93a41bab4cc4a93f41b91d9", // Dres komplet dla chłopca bluza spodnie · niebieski · 59.99 zł
  "al-m-d7e1ee": "https://a.allegroimg.com/original/1108d2/5309f5524a929a9f41849382aa51", // Dres komplet dla chłopca bluza spodnie · zielony · 59.99 zł
  "al-m-1t17ug3": "https://a.allegroimg.com/original/112dd2/b9dfd64245f4865c5f46f7936a51", // Bluza kapturem ciepła gruba rozpinana chłopca · czarny · 49.99 zł
  "al-m-llr6q7": "https://a.allegroimg.com/original/11d71d/6260ff3c4a2db9f98591f63fd19d", // Dres dla chłopca komplet bluza spodnie do przeds · wielokolorowy · 49.99 zł
  "al-m-n5pl2u": "https://a.allegroimg.com/original/11ac8c/50d1ca514376b0a35262cc03484a", // Dres komplet welur dla chłopca bluza spodnie · niebieski (granatowy) · 45 zł
  "al-m-2bpa2f": "https://a.allegroimg.com/original/11a431/318678594a6fbf702a244e0c270d", // Komplet dres niemowlęcy bluza bluzka spodnie · zielony · 59.99 zł
  "al-m-17wkosj": "https://a.allegroimg.com/original/11cb28/5b0cd1ab4fc792b7997b66a926ba", // Komplet dres niemowlęcy bluza bluzka spodnie · niebieski · 55 zł
  "al-m-hk5y89": "https://a.allegroimg.com/original/118033/e9b2fbc44daea41ddd03d8e1a559", // Komplet dres niemowlęcy bluza bluzka spodnie · czerwony · 55 zł
  "al-m-fzyqkb": "https://a.allegroimg.com/original/11c39f/f7b1fc43447ba4b32353d764862d", // Komplet dres niemowlęcy bluza body spodnie · różowy · 59.99 zł
  "al-m-10vaxpw": "https://a.allegroimg.com/original/111bd3/ab5de3e54420898dfe2f32112eaf", // Komplet dres niemowlęcy bluza bluzka spodnie · szary · 55 zł
  "al-m-1x0hj0e": "https://a.allegroimg.com/original/116393/81b425f44a78a703ee4731c7cabb", // Komplet Chłopięcy el. Ogrodniczki Jeans Bluzka z · niebieski · 49.99 zł
  "al-m-1em177v": "https://a.allegroimg.com/original/119a23/26f3e7c24c1eb45fd913d1d9dab2", // Komplet dres niemowlęcy kamizelka body spodnie · niebieski · 53.99 zł
  "al-m-14qdqt5": "https://a.allegroimg.com/original/11169f/ca9af4c0457482a0e2a5d73259e9", // Komplet dres niemowlęcy bluza body spodnie · fioletowy · 59.99 zł
  "al-m-1ngu9y1": "https://a.allegroimg.com/original/11e8fd/a4145cc548de870572c96fcf0d58", // Komplet dres niemowlęcy bluza body spodnie · niebieski · 54.99 zł
};
