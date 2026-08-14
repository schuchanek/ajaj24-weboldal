# ajaj24 – indulás előtti rövid ellenőrzőlista

Az oldalcsomag statikus tárhelyre feltölthető. Az online űrlapok szándékosan csak akkor küldenek adatot és csak akkor mutatnak sikeres állapotot, ha az `assets/js/config.js` fájlban be van állítva egy működő HTTPS végpont.

## Kötelezően véglegesítendő üzleti adatok

- Az `adatvedelem.html` és `aszf.html` szögletes zárójelben maradt cég- és jogi adatait a vállalkozás valós adataival kell kitölteni, majd szakértővel ellenőriztetni.
- A jelenlegi árlista nem állít konkrét árakat; a valós díjakat csak jóváhagyott árlista alapján érdemes megadni.
- Az űrlap-végpontnak `multipart/form-data` POST kérést kell fogadnia, JSON-választ kell adnia, és a `formType` mező alapján kell kezelnie a `sos`, `visszahivas` és `partneri_erdeklodes` típusokat.
- Az SOS-kérésekhez e-mail mellett azonnali ügyeleti értesítés (például SMS vagy belső riasztás) javasolt.
- A tárhelyen a `https://www.ajaj24.hu/index.html` címet 301-es átirányítással a `https://www.ajaj24.hu/` címre kell irányítani.

## Biztonság és adatvédelem

- A végponton legyen szerveroldali validáció, képméret- és fájltípus-korlát, kéretlen beküldés elleni védelem, naplózás és megfelelő adatmegőrzés.
- A Tawk.to chat és a külső Google Fonts használatát az adatvédelmi tájékoztatóban pontosan fel kell tüntetni.
- Marketing- vagy analitikai sütit csak megfelelő hozzájáruláskezelés után szabad aktiválni.
