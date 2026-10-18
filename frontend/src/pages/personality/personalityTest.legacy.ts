// @ts-nocheck -- verbatim port of the inline script on live Personality_Test.php (quiz texts in
// Hindi/English, Prakriti/Guna scoring, Karma (kundli) form). Only the start-up changed: it runs
// after React renders the page markup instead of on window.onload, and the three buttons that used
// inline onclick="…" attributes get listeners here. Listeners live on page elements and go away
// with them when the page unmounts.
export function setupPersonalityTest(): void {
    // React StrictMode re-runs effects on the same DOM: wire the page only once per mount.
    const root = document.getElementById('quizForm');
    if (!root || root.dataset.ready) return;
    root.dataset.ready = '1';

    // Language content with image URLs
    const content = {
        hindi: {
            testDescription: {
                physical: "नीचे दिए गए प्रश्नों के उत्तर दें और अपनी प्रकृति (वात, पित्त, कफ) जानें",
                emotions: "नीचे दिए गए प्रश्नों के उत्तर दें और अपनी प्रकृति (सत्व, रज, तम) जानें",
                kundli: "अपनी जन्म जानकारी दर्ज करें और विस्तृत कुंडली विश्लेषण प्राप्त करें"
            },
            prevText: "पिछला",
            nextText: "अगला",
            submitText: "परिणाम देखें",
            resultHeader: "आपका परिणाम",
            sattvaText: "सत्व",
            rajasText: "रजस्",
            tamasText: "तमस्",
            questionCounter: "प्रश्न",
            balanced: "संतुलित (त्रिगुण संतुलन)",
            sattvaDominant: "सत्व-प्रधान",
            rajasDominant: "रज-प्रधान",
            tamasDominant: "तम-प्रधान",
            mixed: "मिश्रित (द्विगुण)",
            kundliLabels: {
                name: "नाम:",
                dob: "जन्म तिथि (DD/MM/YYYY):",
                time: "जन्म समय (HH:MM):",
                place: "जन्म स्थान:",
                submit: "कुंडली बनाएँ"
            },
            images: {
                physical: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                emotions: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                kundli: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
            },
            imageTexts: {
                physical: "शारीरिक प्रकृति परीक्षण",
                emotions: "भावनात्मक प्रकृति परीक्षण",
                kundli: "कुंडली विश्लेषण"
            },
            physicalQuestions: [
                {
                    question: "आपकी त्वचा का स्वरूप कैसा है?",
                    options: [
                        { text: "शुष्क, रूखी, और ठंडी", guna: "vata" },
                        { text: "गर्म, तैलीय, और संवेदनशील", guna: "pitta" },
                        { text: "नम, चिकनी, और ठंडी", guna: "kapha" }
                    ]
                },
                {
                    question: "आपके बालों की प्रकृति कैसी है?",
                    options: [
                        { text: "सूखे, पतले, और रूखे", guna: "vata" },
                        { text: "चिकने, पतले, जल्दी झड़ने वाले या समय से पहले सफेद", guna: "pitta" },
                        { text: "घने, तैलीय, और चमकदार", guna: "kapha" }
                    ]
                },
                {
                    question: "आपके शरीर का वजन कैसा है?",
                    options: [
                        { text: "पतला, वजन बढ़ाने में कठिनाई", guna: "vata" },
                        { text: "मध्यम, आसानी से वजन नियंत्रित होता है", guna: "pitta" },
                        { text: "भारी, वजन कम करने में कठिनाई", guna: "kapha" }
                    ]
                },
                {
                    question: "आपके जोड़ों का स्वरूप कैसा है?",
                    options: [
                        { text: "कड़कड़ाहट या आवाज करना", guna: "vata" },
                        { text: "सामान्य, कभी-कभी गर्मी या सूजन", guna: "pitta" },
                        { text: "मजबूत, चिकने, और स्थिर", guna: "kapha" }
                    ]
                },
                {
                    question: "आपके नाखून कैसे हैं?",
                    options: [
                        { text: "भंगुर, आसानी से टूटने वाले", guna: "vata" },
                        { text: "नरम, गुलाबी, और चमकदार", guna: "pitta" },
                        { text: "मोटे, मजबूत, और चिकने", guna: "kapha" }
                    ]
                },
                {
                    question: "आपकी शारीरिक गर्मी का स्तर कैसा है?",
                    options: [
                        { text: "ठंडे हाथ-पैर, ठंड के प्रति संवेदनशील", guna: "vata" },
                        { text: "गर्म शरीर, गर्मी के प्रति असहिष्णु", guna: "pitta" },
                        { text: "ठंडा लेकिन आरामदायक, गर्मी-ठंड सहनशील", guna: "kapha" }
                    ]
                },
                {
                    question: "आपके शरीर का आकार कैसा है?",
                    options: [
                        { text: "पतला, अनियमित", guna: "vata" },
                        { text: "मध्यम, संतुलित", guna: "pitta" },
                        { text: "भारी, गोल-मटोल", guna: "kapha" }
                    ]
                },
                {
                    question: "आपकी भूख कैसी रहती है?",
                    options: [
                        { text: "अनियमित, कभी भूख ज्यादा, कभी कम", guna: "vata" },
                        { text: "तीव्र, नियमित, और जल्दी भूख लगना", guna: "pitta" },
                        { text: "धीमी, स्थिर, और कम भूख", guna: "kapha" }
                    ]
                },
                {
                    question: "आपका पाचन कैसा है?",
                    options: [
                        { text: "अनियमित, कभी कब्ज या गैस", guna: "vata" },
                        { text: "तेज, कभी जलन या अम्लता", guna: "pitta" },
                        { text: "धीमा, भारीपन महसूस होना", guna: "kapha" }
                    ]
                },
                {
                    question: "आपके मल त्याग की आदत कैसी है?",
                    options: [
                        { text: "अनियमित, कठोर, और शुष्क", guna: "vata" },
                        { text: "नियमित, नरम, और कभी ढीला", guna: "pitta" },
                        { text: "नियमित, चिकना, और भारी", guna: "kapha" }
                    ]
                },
                {
                    question: "आपको खाने का स्वाद कैसा पसंद है?",
                    options: [
                        { text: "मीठा, खट्टा, नमकीन", guna: "vata" },
                        { text: "मीठा, कड़वा, कसैला", guna: "pitta" },
                        { text: "तीखा, कड़वा, कसैला", guna: "kapha" }
                    ]
                },
                {
                    question: "आपका स्वभाव कैसा है?",
                    options: [
                        { text: "उत्साही, लेकिन जल्दी चिंतित", guna: "vata" },
                        { text: "तीव्र, गुस्सैल, और महत्वाकांक्षी", guna: "pitta" },
                        { text: "शांत, धीमा, और स्थिर", guna: "kapha" }
                    ]
                },
                {
                    question: "आप निर्णय कैसे लेते हैं?",
                    options: [
                        { text: "जल्दी, लेकिन कभी-कभी अनिश्चित", guna: "vata" },
                        { text: "तेज, तार्किक, और निश्चित", guna: "pitta" },
                        { text: "धीरे, विचारशील, और स्थिर", guna: "kapha" }
                    ]
                },
                {
                    question: "आपकी स्मृति कैसी है?",
                    options: [
                        { text: "जल्दी सीखते हैं, जल्दी भूलते हैं", guna: "vata" },
                        { text: "तेज, स्पष्ट, और विश्लेषणात्मक", guna: "pitta" },
                        { text: "धीमी, लेकिन लंबे समय तक याद रहती है", guna: "kapha" }
                    ]
                },
                {
                    question: "आपके सपने कैसे होते हैं?",
                    options: [
                        { text: "उड़ान, भय, और गति से भरे", guna: "vata" },
                        { text: "अग्नि, युद्ध, और तीव्रता से भरे", guna: "pitta" },
                        { text: "जल, शांति, और प्रेम से भरे", guna: "kapha" }
                    ]
                },
                {
                    question: "आपकी नींद कैसी है?",
                    options: [
                        { text: "हल्की, रुक-रुक कर, और कम", guna: "vata" },
                        { text: "मध्यम, लेकिन गर्मी से बाधित", guna: "pitta" },
                        { text: "गहरी, लंबी, और स्थिर", guna: "kapha" }
                    ]
                },
                {
                    question: "आपकी ऊर्जा का स्तर कैसा है?",
                    options: [
                        { text: "अनियमित, जल्दी थकान", guna: "vata" },
                        { text: "तीव्र, लेकिन जल्दी जलन", guna: "pitta" },
                        { text: "स्थिर, लेकिन धीमा", guna: "kapha" }
                    ]
                },
                {
                    question: "आपकी बोलने की शैली कैसी है?",
                    options: [
                        { text: "तेज, अनियमित, और बातूनी", guna: "vata" },
                        { text: "स्पष्ट, तीव्र, और तार्किक", guna: "pitta" },
                        { text: "धीमी, शांत, और मधुर", guna: "kapha" }
                    ]
                },
                {
                    question: "आपका पसीना कैसा है?",
                    options: [
                        { text: "कम, अनियमित", guna: "vata" },
                        { text: "अधिक, गर्म, और गंधयुक्त", guna: "pitta" },
                        { text: "मध्यम, ठंडा, और स्थिर", guna: "kapha" }
                    ]
                },
                {
                    question: "आप मौसम के प्रति कैसी प्रतिक्रिया देते हैं?",
                    options: [
                        { text: "ठंड और हवा पसंद नहीं", guna: "vata" },
                        { text: "गर्मी और धूप पसंद नहीं", guna: "pitta" },
                        { text: "ठंड और नमी पसंद नहीं", guna: "kapha" }
                    ]
                },
                {
                    question: "आपकी कार्यशैली कैसी है?",
                    options: [
                        { text: "रचनात्मक, लेकिन जल्दी विचलित", guna: "vata" },
                        { text: "व्यवस्थित, लक्ष्य-उन्मुख", guna: "pitta" },
                        { text: "धीमी, लेकिन स्थिर और धैर्यवान", guna: "kapha" }
                    ]
                }
            ],
            emotionsQuestions: [
                {
                    question: "आपकी विचार प्रक्रिया कैसी है?",
                    options: [
                        { text: "शांत, स्पष्ट, और तार्किक", guna: "sattva" },
                        { text: "तेज, लक्ष्य-केंद्रित, और महत्वाकांक्षी", guna: "rajas" },
                        { text: "धीमी, भ्रमित, और अनिश्चित", guna: "tamas" }
                    ]
                },
                {
                    question: "निर्णय लेते समय आपका दृष्टिकोण कैसा होता है?",
                    options: [
                        { text: "विचारशील, सभी पहलुओं पर विचार करने वाला", guna: "sattva" },
                        { text: "त्वरित, परिणाम-उन्मुख", guna: "rajas" },
                        { text: "टालमटोल, अनिर्णयात्मक", guna: "tamas" }
                    ]
                },
                {
                    question: "आप नई चीजें कैसे सीखते हैं?",
                    options: [
                        { text: "गहराई से समझने की कोशिश करते हैं", guna: "sattva" },
                        { text: "जल्दी सीखते हैं, परिणाम पर ध्यान", guna: "rajas" },
                        { text: "धीरे सीखते हैं, रुचि कम रहती है", guna: "tamas" }
                    ]
                },
                {
                    question: "आपका ध्यान कैसा रहता है?",
                    options: [
                        { text: "केंद्रित और स्थिर", guna: "sattva" },
                        { text: "बार-बार बदलता, पर सक्रिय", guna: "rajas" },
                        { text: "बिखरा हुआ, विचलित", guna: "tamas" }
                    ]
                },
                {
                    question: "आपके सपने कैसे होते हैं?",
                    options: [
                        { text: "शांतिपूर्ण, आध्यात्मिक, और प्रेरणादायक", guna: "sattva" },
                        { text: "गतिविधि, संघर्ष, या उपलब्धि से भरे", guna: "rajas" },
                        { text: "अंधेरे, भारी, या भ्रमित करने वाले", guna: "tamas" }
                    ]
                },
                {
                    question: "आपके मन की शांति का स्तर कैसा है?",
                    options: [
                        { text: "अधिकतर शांत और संतुष्ट", guna: "sattva" },
                        { text: "कभी-कभी बेचैन, लक्ष्यों पर केंद्रित", guna: "rajas" },
                        { text: "अक्सर अशांत या सुस्त", guna: "tamas" }
                    ]
                },
                {
                    question: "आपके विचारों का प्रवाह कैसा है?",
                    options: [
                        { text: "सकारात्मक, रचनात्मक, और प्रेरक", guna: "sattva" },
                        { text: "ऊर्जावान, परिणाम-केंद्रित", guna: "rajas" },
                        { text: "नकारात्मक, अव्यवस्थित", guna: "tamas" }
                    ]
                },
                {
                    question: "तनाव की स्थिति में आप कैसे प्रतिक्रिया देते हैं?",
                    options: [
                        { text: "शांत रहते हैं, समाधान खोजते हैं", guna: "sattva" },
                        { text: "अधीर, तुरंत कार्रवाई करना चाहते हैं", guna: "rajas" },
                        { text: "हताश या उदासीन हो जाते हैं", guna: "tamas" }
                    ]
                },
                {
                    question: "क्रोध का सामना करने पर आपका व्यवहार कैसा है?",
                    options: [
                        { text: "शांत रहते हैं, क्षमा करने की कोशिश करते हैं", guna: "sattva" },
                        { text: "जल्दी गुस्सा, लेकिन जल्दी शांत", guna: "rajas" },
                        { text: "लंबे समय तक क्रोध या उदासीनता", guna: "tamas" }
                    ]
                },
                {
                    question: "दूसरों के प्रति आपकी भावनाएँ कैसी हैं?",
                    options: [
                        { text: "करुणा और सहानुभूति से भरी", guna: "sattva" },
                        { text: "प्रतिस्पर्धी, पर सहयोगी", guna: "rajas" },
                        { text: "उदासीन या स्वार्थी", guna: "tamas" }
                    ]
                },
                {
                    question: "आपके मूड का स्वभाव कैसा है?",
                    options: [
                        { text: "स्थिर, सकारात्मक", guna: "sattva" },
                        { text: "उतार-चढ़ाव, ऊर्जावान", guna: "rajas" },
                        { text: "सुस्त, उदास", guna: "tamas" }
                    ]
                },
                {
                    question: "आपकी दिनचर्या कैसी है?",
                    options: [
                        { text: "नियमित, संतुलित, और अनुशासित", guna: "sattva" },
                        { text: "व्यस्त, लक्ष्य-केंद्रित", guna: "rajas" },
                        { text: "अनियमित, आलसी", guna: "tamas" }
                    ]
                },
                {
                    question: "आपका भोजन के प्रति दृष्टिकोण कैसा है?",
                    options: [
                        { text: "संतुलित, पौष्टिक भोजन पसंद", guna: "sattva" },
                        { text: "स्वादिष्ट, तीव्र स्वाद पसंद", guna: "rajas" },
                        { text: "भारी, अस्वास्थ्यकर भोजन की लालसा", guna: "tamas" }
                    ]
                },
                {
                    question: "आपकी नींद की आदत कैसी है?",
                    options: [
                        { text: "नियमित, शांतिपूर्ण, और पर्याप्त", guna: "sattva" },
                        { text: "कम, कार्य के कारण बाधित", guna: "rajas" },
                        { text: "अधिक, सुस्ती भरी", guna: "tamas" }
                    ]
                },
                {
                    question: "आपके कार्य की गति कैसी है?",
                    options: [
                        { text: "स्थिर, विचारशील", guna: "sattva" },
                        { text: "तेज, परिणाम-केंद्रित", guna: "rajas" },
                        { text: "धीमी, अनिच्छुक", guna: "tamas" }
                    ]
                },
                {
                    question: "आपकी ऊर्जा का स्तर कैसा है?",
                    options: [
                        { text: "संतुलित, स्थिर", guna: "sattva" },
                        { text: "उच्च, लेकिन उतार-चढ़ाव", guna: "rajas" },
                        { text: "कम, सुस्त", guna: "tamas" }
                    ]
                },
                {
                    question: "आपके शौक क्या हैं?",
                    options: [
                        { text: "रचनात्मक, आध्यात्मिक, या ज्ञानवर्धक", guna: "sattva" },
                        { text: "सक्रिय, रोमांचक, या प्रतिस्पर्धी", guna: "rajas" },
                        { text: "निष्क्रिय, टीवी/मोबाइल पर समय बिताना", guna: "tamas" }
                    ]
                },
                {
                    question: "दूसरों के साथ आपका व्यवहार कैसा है?",
                    options: [
                        { text: "सहानुभूतिपूर्ण, मददगार", guna: "sattva" },
                        { text: "नेतृत्वकारी, प्रभावशाली", guna: "rajas" },
                        { text: "उदासीन, अलग-थलग", guna: "tamas" }
                    ]
                },
                {
                    question: "आपकी संवाद शैली कैसी है?",
                    options: [
                        { text: "शांत, स्पष्ट, और प्रेरक", guna: "sattva" },
                        { text: "तेज, जोशीली, और तार्किक", guna: "rajas" },
                        { text: "धीमी, अस्पष्ट, या चुप", guna: "tamas" }
                    ]
                },
                {
                    question: "आपके लक्ष्य क्या हैं?",
                    options: [
                        { text: "आध्यात्मिक विकास, दूसरों की भलाई", guna: "sattva" },
                        { text: "व्यक्तिगत सफलता, उपलब्धियाँ", guna: "rajas" },
                        { text: "भौतिक सुख, आराम", guna: "tamas" }
                    ]
                },
                {
                    question: "आप संघर्ष को कैसे संभालते हैं?",
                    options: [
                        { text: "शांति और समझौते से", guna: "sattva" },
                        { text: "सक्रियता और समाधान की तलाश में", guna: "rajas" },
                        { text: "टालमटोल या उदासीनता से", guna: "tamas" }
                    ]
                }
            ],
            descriptions: {
                balanced: "आपके तीनों गुण (सत्व, रज, तम) संतुलित अवस्था में हैं। यह एक आदर्श स्थिति है जहाँ आप शांति, ऊर्जा और स्थिरता के बीच संतुलन बनाए रखते हैं।",
                vata: "आपकी प्रकृति वात-प्रधान है। वात दोष आपको रचनात्मक, उत्साही और सक्रिय बनाता है, लेकिन कभी-कभी चिंताग्रस्त और अस्थिर भी कर सकता है।",
                pitta: "आपकी प्रकृति पित्त-प्रधान है। पित्त दोष आपको बुद्धिमान, नेतृत्वकर्ता और संगठित बनाता है, लेकिन कभी-कभी क्रोधी और आलोचनात्मक भी बना सकता है।",
                kapha: "आपकी प्रकृति कफ-प्रधान है। कफ दोष आपको शांत, स्थिर और देखभाल करने वाला बनाता है, लेकिन कभी-कभी आलसी और प्रतिरोधी भी बना सकता है।",
                sattva: "आपकी प्रकृति सत्व-प्रधान है। सत्व गुण आपको शांत, संतुष्ट और ज्ञान की ओर उन्मुख बनाता है।",
                rajas: "आपकी प्रकृति रज-प्रधान है। रज गुण आपको ऊर्जावान, महत्वाकांक्षी और क्रियाशील बनाता है, लेकिन कभी-कभी अशांत भी कर सकता है।",
                tamas: "आपकी प्रकृति तम-प्रधान है। तम गुण आलस्य, निष्क्रियता और भ्रम पैदा कर सकता है।",
                mixed: "आपमें दो गुण प्रमुख हैं। आपको दोनों गुणों को संतुलित करने वाली जीवनशैली अपनानी चाहिए।"
            },
            suggestions: {
                vata: {
                    diet: "गर्म, पौष्टिक और नमीयुक्त भोजन, नियमित समय पर भोजन, दूध, घी, नट्स का सेवन",
                    lifestyle: "नियमित दिनचर्या बनाए रखें, शांत और गर्म वातावरण में रहें, हल्का व्यायाम और योग",
                    activities: "ध्यान, प्राणायाम, शांत संगीत सुनना, नियमित नींद"
                },
                pitta: {
                    diet: "ठंडा और ताजा भोजन, मसालेदार भोजन से परहेज, मीठे फल और सब्जियाँ",
                    lifestyle: "ठंडे वातावरण में समय बिताएं, तनाव प्रबंधन तकनीकें, नियमित विश्राम",
                    activities: "तैराकी, चंद्र नमस्कार, शीतल प्राणायाम, प्रकृति में समय"
                },
                kapha: {
                    diet: "हल्का और गर्म भोजन, वसायुक्त भोजन से परहेज, मसालेदार और सूखा भोजन",
                    lifestyle: "नियमित और जोरदार व्यायाम, सक्रिय जीवनशैली, विविधता और नई गतिविधियाँ",
                    activities: "दौड़ना, सूर्य नमस्कार, एरोबिक्स, नृत्य"
                },
                sattva: {
                    diet: "सात्विक भोजन (ताज़ा फल, सब्जियाँ, साबुत अन्न), शुद्ध और प्राकृतिक भोजन",
                    lifestyle: "नियमित ध्यान, योग, प्रकृति में समय बिताना, सकारात्मक लोगों के साथ समय",
                    activities: "ज्ञानवर्धक पुस्तकें पढ़ना, सेवा कार्य, आध्यात्मिक अभ्यास, प्रार्थना"
                },
                rajas: {
                    diet: "संतुलित आहार, मसालेदार भोजन से परहेज, नियमित भोजन समय",
                    lifestyle: "नियमित व्यायाम, समय प्रबंधन, विश्राम और नींद, तनाव प्रबंधन",
                    activities: "खेल, रचनात्मक कार्य, सामाजिक गतिविधियाँ, रचनात्मक शौक, सामाजिक सेवा"
                },
                tamas: {
                    diet: "हल्का भोजन, प्रसंस्कृत भोजन से परहेज, ताजा और हल्का भोजन",
                    lifestyle: "नियमित दिनचर्या, व्यायाम, सकारात्मक वातावरण, प्रेरक लोगों के साथ समय",
                    activities: "सैर, संगीत, प्रेरक लोगों के साथ समय, नियमित व्यायाम, स्वयंसेवा"
                }
            }
        },
        english: {
            testDescription: {
                physical: "Answer the following questions to know your nature (Vata, Pitta, Kapha)",
                emotions: "Answer the following questions to know your nature (Sattva, Rajas, Tamas)",
                kundli: "Enter your birth details to get detailed Karma Situation"
            },
            prevText: "Previous",
            nextText: "Next",
            submitText: "View Results",
            resultHeader: "Your Result",
            sattvaText: "Sattva",
            rajasText: "Rajas",
            tamasText: "Tamas",
            questionCounter: "Question",
            balanced: "Balanced (Triguna Balance)",
            sattvaDominant: "Sattva-Dominant",
            rajasDominant: "Rajas-Dominant",
            tamasDominant: "Tamas-Dominant",
            mixed: "Mixed (Dual Guna)",
            kundliLabels: {
                name: "Name:",
                dob: "Date of Birth (DD/MM/YYYY):",
                time: "Time of Birth (HH:MM):",
                place: "Place of Birth:",
                submit: "Generate Kundli"
            },
            images: {
                physical: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                emotions: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                kundli: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
            },
            imageTexts: {
                physical: "Physical Nature Test",
                emotions: "Emotional Nature Test",
                kundli: "Karma Situation"
            },
            physicalQuestions: [
                {
                    question: "What is the nature of your skin?",
                    options: [
                        { text: "Dry, rough, and cold", guna: "vata" },
                        { text: "Warm, oily, and sensitive", guna: "pitta" },
                        { text: "Moist, smooth, and cool", guna: "kapha" }
                    ]
                },
                {
                    question: "What is the nature of your hair?",
                    options: [
                        { text: "Dry, thin, and brittle", guna: "vata" },
                        { text: "Soft, thin, prone to premature graying or hair loss", guna: "pitta" },
                        { text: "Thick, oily, and lustrous", guna: "kapha" }
                    ]
                },
                {
                    question: "What is your body weight like?",
                    options: [
                        { text: "Thin, difficulty gaining weight", guna: "vata" },
                        { text: "Medium, weight is easy to maintain", guna: "pitta" },
                        { text: "Heavy, difficulty losing weight", guna: "kapha" }
                    ]
                },
                {
                    question: "What is the nature of your joints?",
                    options: [
                        { text: "Crackling or making sounds", guna: "vata" },
                        { text: "Normal, sometimes with heat or swelling", guna: "pitta" },
                        { text: "Strong, smooth, and stable", guna: "kapha" }
                    ]
                },
                {
                    question: "What are your nails like?",
                    options: [
                        { text: "Brittle, easily breakable", guna: "vata" },
                        { text: "Soft, pink, and shiny", guna: "pitta" },
                        { text: "Thick, strong, and smooth", guna: "kapha" }
                    ]
                },
                {
                    question: "What is your body heat level like?",
                    options: [
                        { text: "Cold hands and feet, sensitive to cold", guna: "vata" },
                        { text: "Hot body, intolerant to heat", guna: "pitta" },
                        { text: "Cool but comfortable, tolerant to heat and cold", guna: "kapha" }
                    ]
                },
                {
                    question: "What is your body shape like?",
                    options: [
                        { text: "Thin, irregular", guna: "vata" },
                        { text: "Medium, balanced", guna: "pitta" },
                        { text: "Heavy, rounded", guna: "kapha" }
                    ]
                },
                {
                    question: "What is your appetite like?",
                    options: [
                        { text: "Irregular, sometimes very hungry, sometimes less", guna: "vata" },
                        { text: "Strong, regular, and quick to get hungry", guna: "pitta" },
                        { text: "Slow, steady, and low appetite", guna: "kapha" }
                    ]
                },
                {
                    question: "What is your digestion like?",
                    options: [
                        { text: "Irregular, sometimes constipated or gassy", guna: "vata" },
                        { text: "Fast, sometimes with burning or acidity", guna: "pitta" },
                        { text: "Slow, feeling of heaviness", guna: "kapha" }
                    ]
                },
                {
                    question: "What are your bowel movements like?",
                    options: [
                        { text: "Irregular, hard, and dry", guna: "vata" },
                        { text: "Regular, soft, and sometimes loose", guna: "pitta" },
                        { text: "Regular, smooth, and heavy", guna: "kapha" }
                    ]
                },
                {
                    question: "What taste do you prefer in food?",
                    options: [
                        { text: "Sweet, sour, salty", guna: "vata" },
                        { text: "Sweet, bitter, astringent", guna: "pitta" },
                        { text: "Pungent, bitter, astringent", guna: "kapha" }
                    ]
                },
                {
                    question: "What is your temperament like?",
                    options: [
                        { text: "Enthusiastic, but quickly anxious", guna: "vata" },
                        { text: "Intense, angry, and ambitious", guna: "pitta" },
                        { text: "Calm, slow, and stable", guna: "kapha" }
                    ]
                },
                {
                    question: "How do you make decisions?",
                    options: [
                        { text: "Quickly, but sometimes uncertain", guna: "vata" },
                        { text: "Fast, logical, and definite", guna: "pitta" },
                        { text: "Slowly, thoughtful, and stable", guna: "kapha" }
                    ]
                },
                {
                    question: "What is your memory like?",
                    options: [
                        { text: "Learn quickly, forget quickly", guna: "vata" },
                        { text: "Sharp, clear, and analytical", guna: "pitta" },
                        { text: "Slow, but remembers for long time", guna: "kapha" }
                    ]
                },
                {
                    question: "What are your dreams like?",
                    options: [
                        { text: "Filled with flying, fear, and motion", guna: "vata" },
                        { text: "Filled with fire, war, and intensity", guna: "pitta" },
                        { text: "Filled with water, peace, and love", guna: "kapha" }
                    ]
                },
                {
                    question: "What is your sleep like?",
                    options: [
                        { text: "Light, interrupted, and less", guna: "vata" },
                        { text: "Moderate, but disturbed by heat", guna: "pitta" },
                        { text: "Deep, long, and stable", guna: "kapha" }
                    ]
                },
                {
                    question: "What is your energy level like?",
                    options: [
                        { text: "Irregular, quick fatigue", guna: "vata" },
                        { text: "Intense, but quick irritation", guna: "pitta" },
                        { text: "Stable, but slow", guna: "kapha" }
                    ]
                },
                {
                    question: "What is your speaking style like?",
                    options: [
                        { text: "Fast, irregular, and talkative", guna: "vata" },
                        { text: "Clear, sharp, and logical", guna: "pitta" },
                        { text: "Slow, calm, and sweet", guna: "kapha" }
                    ]
                },
                {
                    question: "What is your sweat like?",
                    options: [
                        { text: "Less, irregular", guna: "vata" },
                        { text: "More, hot, and odorous", guna: "pitta" },
                        { text: "Moderate, cold, and stable", guna: "kapha" }
                    ]
                },
                {
                    question: "How do you react to weather?",
                    options: [
                        { text: "Don't like cold and wind", guna: "vata" },
                        { text: "Don't like heat and sun", guna: "pitta" },
                        { text: "Don't like cold and moisture", guna: "kapha" }
                    ]
                },
                {
                    question: "What is your work style like?",
                    options: [
                        { text: "Creative, but easily distracted", guna: "vata" },
                        { text: "Systematic, goal-oriented", guna: "pitta" },
                        { text: "Slow, but stable and patient", guna: "kapha" }
                    ]
                }
            ],
            emotionsQuestions: [
                {
                    question: "What is your thought process like?",
                    options: [
                        { text: "Calm, clear, and logical", guna: "sattva" },
                        { text: "Fast, goal-oriented, and ambitious", guna: "rajas" },
                        { text: "Slow, confused, and uncertain", guna: "tamas" }
                    ]
                },
                {
                    question: "What is your approach to decision making?",
                    options: [
                        { text: "Thoughtful, considers all aspects", guna: "sattva" },
                        { text: "Quick, result-oriented", guna: "rajas" },
                        { text: "Procrastinating, indecisive", guna: "tamas" }
                    ]
                },
                {
                    question: "How do you learn new things?",
                    options: [
                        { text: "Try to understand deeply", guna: "sattva" },
                        { text: "Learn quickly, focus on results", guna: "rajas" },
                        { text: "Learn slowly, less interest", guna: "tamas" }
                    ]
                },
                {
                    question: "How is your concentration?",
                    options: [
                        { text: "Focused and stable", guna: "sattva" },
                        { text: "Keeps changing but active", guna: "rajas" },
                        { text: "Scattered, distracted", guna: "tamas" }
                    ]
                },
                {
                    question: "What are your dreams like?",
                    options: [
                        { text: "Peaceful, spiritual, and inspiring", guna: "sattva" },
                        { text: "Full of activity, conflict, or achievement", guna: "rajas" },
                        { text: "Dark, heavy, or confusing", guna: "tamas" }
                    ]
                },
                {
                    question: "What is your level of mental peace?",
                    options: [
                        { text: "Mostly calm and content", guna: "sattva" },
                        { text: "Sometimes restless, focused on goals", guna: "rajas" },
                        { text: "Often disturbed or dull", guna: "tamas" }
                    ]
                },
                {
                    question: "How is the flow of your thoughts?",
                    options: [
                        { text: "Positive, creative, and inspiring", guna: "sattva" },
                        { text: "Energetic, result-focused", guna: "rajas" },
                        { text: "Negative, disorganized", guna: "tamas" }
                    ]
                },
                {
                    question: "How do you react in stressful situations?",
                    options: [
                        { text: "Stay calm, look for solutions", guna: "sattva" },
                        { text: "Impatient, want to act immediately", guna: "rajas" },
                        { text: "Feel hopeless or indifferent", guna: "tamas" }
                    ]
                },
                {
                    question: "What is your behavior when angry?",
                    options: [
                        { text: "Stay calm, try to forgive", guna: "sattva" },
                        { text: "Get angry quickly but calm down quickly", guna: "rajas" },
                        { text: "Hold anger or indifference for long", guna: "tamas" }
                    ]
                },
                {
                    question: "What are your feelings towards others?",
                    options: [
                        { text: "Full of compassion and empathy", guna: "sattva" },
                        { text: "Competitive but cooperative", guna: "rajas" },
                        { text: "Indifferent or selfish", guna: "tamas" }
                    ]
                },
                {
                    question: "What is your mood temperament like?",
                    options: [
                        { text: "Stable, positive", guna: "sattva" },
                        { text: "Fluctuating, energetic", guna: "rajas" },
                        { text: "Dull, depressed", guna: "tamas" }
                    ]
                },
                {
                    question: "What is your routine like?",
                    options: [
                        { text: "Regular, balanced, and disciplined", guna: "sattva" },
                        { text: "Busy, goal-focused", guna: "rajas" },
                        { text: "Irregular, lazy", guna: "tamas" }
                    ]
                },
                {
                    question: "What is your approach to food?",
                    options: [
                        { text: "Balanced, prefer nutritious food", guna: "sattva" },
                        { text: "Delicious, prefer intense flavors", guna: "rajas" },
                        { text: "Craving for heavy, unhealthy food", guna: "tamas" }
                    ]
                },
                {
                    question: "What are your sleep habits like?",
                    options: [
                        { text: "Regular, peaceful, and adequate", guna: "sattva" },
                        { text: "Less, interrupted due to work", guna: "rajas" },
                        { text: "More, lethargic", guna: "tamas" }
                    ]
                },
                {
                    question: "What is your work speed like?",
                    options: [
                        { text: "Steady, thoughtful", guna: "sattva" },
                        { text: "Fast, result-focused", guna: "rajas" },
                        { text: "Slow, reluctant", guna: "tamas" }
                    ]
                },
                {
                    question: "What is your energy level like?",
                    options: [
                        { text: "Balanced, stable", guna: "sattva" },
                        { text: "High, but fluctuating", guna: "rajas" },
                        { text: "Low, sluggish", guna: "tamas" }
                    ]
                },
                {
                    question: "What are your hobbies?",
                    options: [
                        { text: "Creative, spiritual, or knowledge-enhancing", guna: "sattva" },
                        { text: "Active, exciting, or competitive", guna: "rajas" },
                        { text: "Passive, spending time on TV/mobile", guna: "tamas" }
                    ]
                },
                {
                    question: "What is your behavior with others?",
                    options: [
                        { text: "Sympathetic, helpful", guna: "sattva" },
                        { text: "Leadership, influential", guna: "rajas" },
                        { text: "Indifferent, isolated", guna: "tamas" }
                    ]
                },
                {
                    question: "What is your communication style?",
                    options: [
                        { text: "Calm, clear, and inspiring", guna: "sattva" },
                        { text: "Fast, enthusiastic, and logical", guna: "rajas" },
                        { text: "Slow, unclear, or silent", guna: "tamas" }
                    ]
                },
                {
                    question: "What are your goals?",
                    options: [
                        { text: "Spiritual growth, welfare of others", guna: "sattva" },
                        { text: "Personal success, achievements", guna: "rajas" },
                        { text: "Material pleasures, comfort", guna: "tamas" }
                    ]
                },
                {
                    question: "How do you handle conflict?",
                    options: [
                        { text: "With peace and agreement", guna: "sattva" },
                        { text: "With activity and seeking solutions", guna: "rajas" },
                        { text: "With procrastination or indifference", guna: "tamas" }
                    ]
                }
            ],
            descriptions: {
                balanced: "All three gunas (Sattva, Rajas, Tamas) are in balanced state. This is an ideal condition where you maintain balance between peace, energy and stability.",
                vata: "Your nature is Vata-dominant. Vata dosha makes you creative, enthusiastic and active, but can sometimes make you anxious and unstable.",
                pitta: "Your nature is Pitta-dominant. Pitta dosha makes you intelligent, leader-like and organized, but can sometimes make you angry and critical.",
                kapha: "Your nature is Kapha-dominant. Kapha dosha makes you calm, stable and caring, but can sometimes make you lazy and resistant to change.",
                sattva: "Your nature is Sattva-dominant. Sattva guna makes you calm, content and oriented towards knowledge.",
                rajas: "Your nature is Rajas-dominant. Rajas guna makes you energetic, ambitious and active, but can sometimes make you restless.",
                tamas: "Your nature is Tamas-dominant. Tamas guna can create laziness, inactivity and confusion.",
                mixed: "You have two dominant gunas. You should adopt a lifestyle that balances both gunas."
            },
            suggestions: {
                vata: {
                    diet: "Warm, nutritious and moist food, regular meal times, consumption of milk, ghee, nuts",
                    lifestyle: "Maintain regular routine, stay in calm and warm environment, light exercise and yoga",
                    activities: "Meditation, pranayama, listening to calm music, regular sleep"
                },
                pitta: {
                    diet: "Cool and fresh food, avoid spicy food, sweet fruits and vegetables",
                    lifestyle: "Spend time in cool environment, stress management techniques, regular relaxation",
                    activities: "Swimming, moon salutations, cooling pranayama, time in nature"
                },
                kapha: {
                    diet: "Light and warm food, avoid fatty food, spicy and dry food",
                    lifestyle: "Regular and vigorous exercise, active lifestyle, variety and new activities",
                    activities: "Running, sun salutations, aerobics, dancing"
                },
                sattva: {
                    diet: "Sattvic food (fresh fruits, vegetables, whole grains), pure and natural food",
                    lifestyle: "Regular meditation, yoga, time in nature, time with positive people",
                    activities: "Reading knowledge books, service work, spiritual practices, prayer"
                },
                rajas: {
                    diet: "Balanced diet, avoid spicy food, regular meal times",
                    lifestyle: "Regular exercise, time management, rest and sleep, stress management",
                    activities: "Sports, creative work, social activities, creative hobbies, social service"
                },
                tamas: {
                    diet: "Light food, avoid processed food, fresh and light food",
                    lifestyle: "Regular routine, exercise, positive environment, time with inspiring people",
                    activities: "Walking, music, time with inspiring people, regular exercise, volunteering"
                }
            }
        }
    };

    // Current state
    let currentLanguage = 'hindi';
    let currentTestType = 'physical';
    let currentQuestion = 0;
    let totalQuestions = 0;
    let answers = [];
    
    // DOM elements
    const hindiBtn = document.getElementById('hindiBtn');
    const englishBtn = document.getElementById('englishBtn');
    const physicalTab = document.getElementById('physicalTab');
    const emotionsTab = document.getElementById('emotionsTab');
    const kundliTab = document.getElementById('kundliTab');
    const quizForm = document.getElementById('quizForm');
    const kundliContainer = document.getElementById('kundliContainer');
    const kundliForm = document.getElementById('kundliForm');
    const kundliOutput = document.getElementById('kundliOutput');
    const progressBar = document.getElementById('progressBar');
    const currentQuestionEl = document.getElementById('currentQuestion');
    const totalQuestionsEl = document.getElementById('totalQuestions');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const resultContainer = document.getElementById('resultContainer');
    const gunaResult = document.getElementById('gunaResult');
    const sattvaScoreEl = document.getElementById('sattvaScore');
    const rajasScoreEl = document.getElementById('rajasScore');
    const tamasScoreEl = document.getElementById('tamasScore');
    const sattvaBar = document.getElementById('sattvaBar');
    const rajasBar = document.getElementById('rajasBar');
    const tamasBar = document.getElementById('tamasBar');
    const sattvaPercentage = document.getElementById('sattvaPercentage');
    const rajasPercentage = document.getElementById('rajasPercentage');
    const tamasPercentage = document.getElementById('tamasPercentage');
    const gunaDescription = document.getElementById('gunaDescription');
    const headerImage = document.getElementById('headerImage');
    const headerImageText = document.getElementById('headerImageText');
    const suggestionsContainer = document.getElementById('suggestionsContainer');
    const suggestionsTitle = document.getElementById('suggestionsTitle');
    const suggestionsContent = document.getElementById('suggestionsContent');

    // Initialize the quiz
    function initQuiz() {
        updateTestContent();
        updateHeaderImage();
        
        // Set up language switchers
        hindiBtn.addEventListener('click', () => switchLanguage('hindi'));
        englishBtn.addEventListener('click', () => switchLanguage('english'));
        
        // Set up test type tabs
        physicalTab.addEventListener('click', () => switchTestType('physical'));
        emotionsTab.addEventListener('click', () => switchTestType('emotions'));
        kundliTab.addEventListener('click', () => switchTestType('kundli'));

        // Set up kundli form
        kundliForm.addEventListener('submit', generateKundli);
        
        // Initialize first test
        switchTestType('physical');
    }

    // Switch language
    function switchLanguage(lang) {
        currentLanguage = lang;
        hindiBtn.classList.toggle('active', lang === 'hindi');
        englishBtn.classList.toggle('active', lang === 'english');
        updateTestContent();
        updateHeaderImage();
        updateKundliFormLabels();
        
        // Reload current test questions if not on kundli tab
        if (currentTestType !== 'kundli') {
            const questions = content[currentLanguage][currentTestType + 'Questions'];
            totalQuestions = questions.length;
            answers = Array(totalQuestions).fill(null);
            showQuestion(currentQuestion);
            updateProgressBar();
            updateQuestionCounter();
        }
    }

    // Switch test type
    function switchTestType(type) {
        currentTestType = type;
        
        // Update active tab
        physicalTab.classList.remove('active');
        emotionsTab.classList.remove('active');
        kundliTab.classList.remove('active');
        document.getElementById(type + 'Tab').classList.add('active');
        
        if (type === 'kundli') {
            // Show kundli form, hide quiz
            quizForm.style.display = 'none';
            document.querySelector('.progress-container').style.display = 'none';
            document.querySelector('.question-counter').style.display = 'none';
            document.querySelector('.navigation-buttons').style.display = 'none';
            kundliContainer.style.display = 'block';
            resultContainer.style.display = 'none';
        } else {
            // Show quiz, hide kundli form
            quizForm.style.display = 'block';
            document.querySelector('.progress-container').style.display = 'block';
            document.querySelector('.question-counter').style.display = 'block';
            document.querySelector('.navigation-buttons').style.display = 'flex';
            kundliContainer.style.display = 'none';
            resultContainer.style.display = 'none';
            
            const questions = content[currentLanguage][currentTestType + 'Questions'];
            totalQuestions = questions.length;
            answers = Array(totalQuestions).fill(null);
            currentQuestion = 0;
            
            showQuestion(currentQuestion);
            updateProgressBar();
            updateQuestionCounter();
        }
        
        updateTestContent();
        updateHeaderImage();
    }

    // Update header image based on current test type and language
    function updateHeaderImage() {
        const imageUrl = content[currentLanguage].images[currentTestType];
        const imageText = content[currentLanguage].imageTexts[currentTestType];
        
        headerImage.style.backgroundImage = `url(${imageUrl})`;
        headerImageText.textContent = imageText;
    }

    // Update kundli form labels
    function updateKundliFormLabels() {
        document.getElementById('nameLabel').textContent = content[currentLanguage].kundliLabels.name;
        document.getElementById('dobLabel').textContent = content[currentLanguage].kundliLabels.dob;
        document.getElementById('timeLabel').textContent = content[currentLanguage].kundliLabels.time;
        document.getElementById('placeLabel').textContent = content[currentLanguage].kundliLabels.place;
        document.getElementById('kundliSubmitBtn').textContent = content[currentLanguage].kundliLabels.submit;
    }

    // Update test content based on current language and test type
    function updateTestContent() {
        document.getElementById('testDescription').textContent = content[currentLanguage].testDescription[currentTestType];
        document.getElementById('prevText').textContent = content[currentLanguage].prevText;
        document.getElementById('nextText').textContent = content[currentLanguage].nextText;
        document.getElementById('submitText').textContent = content[currentLanguage].submitText;
        document.getElementById('resultHeader').textContent = content[currentLanguage].resultHeader;
        document.getElementById('sattvaText').textContent = content[currentLanguage].sattvaText;
        document.getElementById('rajasText').textContent = content[currentLanguage].rajasText;
        document.getElementById('tamasText').textContent = content[currentLanguage].tamasText;
    }

    // Show a specific question
    function showQuestion(index) {
        quizForm.innerHTML = '';
        
        const questions = content[currentLanguage][currentTestType + 'Questions'];
        const question = questions[index];
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-container active';
        questionDiv.innerHTML = `<div class="question-text">${question.question}</div>`;
        
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options-container';
        
        question.options.forEach((option, i) => {
            const optionId = `q${index}_option${i}`;
            const isSelected = answers[index] === option.guna;
            
            const optionItem = document.createElement('label');
            optionItem.className = `option-item ${isSelected ? 'selected' : ''}`;
            optionItem.htmlFor = optionId;
            
            optionItem.innerHTML = `
                <div class="option-radio"></div>
                <div class="option-text">${option.text}</div>
                <input type="radio" id="${optionId}" name="question${index}" value="${option.guna}" 
                    ${isSelected ? 'checked' : ''}>
            `;
            
            optionItem.addEventListener('click', () => selectOption(index, option.guna));
            optionsContainer.appendChild(optionItem);
        });
        
        questionDiv.appendChild(optionsContainer);
        quizForm.appendChild(questionDiv);
        
        // Update button states
        prevBtn.disabled = index === 0;
        nextBtn.style.display = index === totalQuestions - 1 ? 'none' : 'block';
        submitBtn.style.display = index === totalQuestions - 1 ? 'block' : 'none';
    }

    // Select an option
    function selectOption(questionIndex, guna) {
        answers[questionIndex] = guna;
        showQuestion(questionIndex); // Refresh to show selection
    }

    // Go to next question
    function nextQuestion() {
        if (currentQuestion < totalQuestions - 1) {
            currentQuestion++;
            showQuestion(currentQuestion);
            updateProgressBar();
            updateQuestionCounter();
        }
    }

    // Go to previous question
    function prevQuestion() {
        if (currentQuestion > 0) {
            currentQuestion--;
            showQuestion(currentQuestion);
            updateProgressBar();
            updateQuestionCounter();
        }
    }

    // Update progress bar
    function updateProgressBar() {
        const progress = ((currentQuestion + 1) / totalQuestions) * 100;
        progressBar.style.width = `${progress}%`;
    }

    // Update question counter
    function updateQuestionCounter() {
        currentQuestionEl.textContent = currentQuestion + 1;
        totalQuestionsEl.textContent = totalQuestions;
    }

    // Generate Kundli
    function generateKundli(event) {
        event.preventDefault();
        
        const name = document.getElementById('name').value;
        const dob = document.getElementById('dob').value;
        const time = document.getElementById('time').value;
        const place = document.getElementById('place').value;
        
        // Simple Karma Situation based on input
        const kundliResult = generateKundliAnalysis(name, dob, time, place);
        kundliOutput.innerHTML = kundliResult;
    }

    // Generate Karma Situation
    function generateKundliAnalysis(name, dob, time, place) {
        // This is a simplified version - in real application you would use proper astrology calculations
        const dobParts = dob.split('/');
        const day = parseInt(dobParts[0]);
        const month = parseInt(dobParts[1]);
        const year = parseInt(dobParts[2]);
        
        const timeParts = time.split(':');
        const hour = parseInt(timeParts[0]);
        
        // Simple zodiac calculation
        const zodiacSigns = {
            hindi: ["मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुम्भ", "मीन"],
            english: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
        };
        
        const zodiacIndex = (month - 1) % 12;
        const zodiacSign = currentLanguage === 'hindi' ? zodiacSigns.hindi[zodiacIndex] : zodiacSigns.english[zodiacIndex];
        
        // Simple nakshatra calculation (approximate)
        const nakshatras = {
            hindi: ["अश्विनी", "भरणी", "कृत्तिका", "रोहिणी", "मृगशिरा", "आर्द्रा", "पुनर्वसु", "पुष्य", "आश्लेषा", "मघा", "पूर्व फाल्गुनी", "उत्तर फाल्गुनी", "हस्त", "चित्रा", "स्वाती", "विशाखा", "अनुराधा", "ज्येष्ठा", "मूल", "पूर्वाषाढ़ा", "उत्तराषाढ़ा", "श्रवण", "धनिष्ठा", "शतभिषा", "पूर्व भाद्रपद", "उत्तर भाद्रपद", "रेवती"],
            english: ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"]
        };
        
        const nakshatraIndex = (day - 1) % 27;
        const nakshatra = currentLanguage === 'hindi' ? nakshatras.hindi[nakshatraIndex] : nakshatras.english[nakshatraIndex];
        
        if (currentLanguage === 'hindi') {
            return `
                <h3>${name} की कुंडली</h3>
                <p><strong>जन्म तिथि:</strong> ${dob}</p>
                <p><strong>जन्म समय:</strong> ${time}</p>
                <p><strong>जन्म स्थान:</strong> ${place}</p>
                <p><strong>राशि:</strong> ${zodiacSign}</p>
                <p><strong>नक्षत्र:</strong> ${nakshatra}</p>
                <p><strong>लग्न:</strong> मेष</p>
                <p><strong>विशेषता:</strong> आपकी कुंडली में ग्रहों की स्थिति अनुकूल है। आपमें नेतृत्व क्षमता और रचनात्मकता प्रबल है।</p>
                <p><strong>सलाह:</strong> नियमित ध्यान और व्यायाम से आप अपनी ऊर्जा को सही दिशा में लगा सकते हैं।</p>
            `;
        } else {
            return `
                <h3>Kundli for ${name}</h3>
                <p><strong>Date of Birth:</strong> ${dob}</p>
                <p><strong>Time of Birth:</strong> ${time}</p>
                <p><strong>Place of Birth:</strong> ${place}</p>
                <p><strong>Zodiac Sign:</strong> ${zodiacSign}</p>
                <p><strong>Nakshatra:</strong> ${nakshatra}</p>
                <p><strong>Lagna:</strong> Aries</p>
                <p><strong>Specialty:</strong> The planetary positions in your kundli are favorable. You have strong leadership qualities and creativity.</p>
                <p><strong>Advice:</strong> You can channel your energy in the right direction through regular meditation and exercise.</p>
            `;
        }
    }

    // Submit quiz and show results
    function submitQuiz() {
        // Calculate scores based on test type
        let scores = {};
        const questions = content[currentLanguage][currentTestType + 'Questions'];
        
        if (currentTestType === 'physical') {
            // For physical test, calculate vata, pitta, kapha
            scores = { vata: 0, pitta: 0, kapha: 0 };
            answers.forEach(answer => {
                if (answer === 'vata') scores.vata++;
                else if (answer === 'pitta') scores.pitta++;
                else if (answer === 'kapha') scores.kapha++;
            });
        } else {
            // For emotions test, calculate sattva, rajas, tamas
            scores = { sattva: 0, rajas: 0, tamas: 0 };
            answers.forEach(answer => {
                if (answer === 'sattva') scores.sattva++;
                else if (answer === 'rajas') scores.rajas++;
                else if (answer === 'tamas') scores.tamas++;
            });
        }

        // Calculate percentages
        const total = Object.values(scores).reduce((a, b) => a + b, 0);
        const percentages = {};
        for (const [key, value] of Object.entries(scores)) {
            percentages[key] = Math.round((value / total) * 100);
        }

        // Display scores and percentages
        if (currentTestType === 'physical') {
            // Physical test results (Vata, Pitta, Kapha)
            sattvaScoreEl.textContent = scores.vata;
            rajasScoreEl.textContent = scores.pitta;
            tamasScoreEl.textContent = scores.kapha;
            
            sattvaBar.style.width = `${percentages.vata}%`;
            rajasBar.style.width = `${percentages.pitta}%`;
            tamasBar.style.width = `${percentages.kapha}%`;
            
            sattvaPercentage.textContent = `${percentages.vata}%`;
            rajasPercentage.textContent = `${percentages.pitta}%`;
            tamasPercentage.textContent = `${percentages.kapha}%`;

            // Update labels for physical test
            document.getElementById('sattvaText').textContent = currentLanguage === 'hindi' ? 'वात' : 'Vata';
            document.getElementById('rajasText').textContent = currentLanguage === 'hindi' ? 'पित्त' : 'Pitta';
            document.getElementById('tamasText').textContent = currentLanguage === 'hindi' ? 'कफ' : 'Kapha';

            // Determine primary dosha
            const maxScore = Math.max(scores.vata, scores.pitta, scores.kapha);
            let resultText = '';
            let description = '';
            let dominantDosha = '';

            if (scores.vata === scores.pitta && scores.pitta === scores.kapha) {
                resultText = currentLanguage === 'hindi' ? 'संतुलित (त्रिदोष संतुलन)' : 'Balanced (Tridosha Balance)';
                description = content[currentLanguage].descriptions.balanced;
                dominantDosha = 'balanced';
            } else if (scores.vata > scores.pitta && scores.vata > scores.kapha) {
                resultText = currentLanguage === 'hindi' ? 'वात-प्रधान' : 'Vata-Dominant';
                description = content[currentLanguage].descriptions.vata;
                dominantDosha = 'vata';
            } else if (scores.pitta > scores.vata && scores.pitta > scores.kapha) {
                resultText = currentLanguage === 'hindi' ? 'पित्त-प्रधान' : 'Pitta-Dominant';
                description = content[currentLanguage].descriptions.pitta;
                dominantDosha = 'pitta';
            } else if (scores.kapha > scores.vata && scores.kapha > scores.pitta) {
                resultText = currentLanguage === 'hindi' ? 'कफ-प्रधान' : 'Kapha-Dominant';
                description = content[currentLanguage].descriptions.kapha;
                dominantDosha = 'kapha';
            } else {
                // Dual dosha conditions
                if (scores.vata === scores.pitta && scores.vata > scores.kapha) {
                    resultText = currentLanguage === 'hindi' ? 'वात-पित्त प्रधान' : 'Vata-Pitta Dominant';
                    dominantDosha = 'vata-pitta';
                } else if (scores.vata === scores.kapha && scores.vata > scores.pitta) {
                    resultText = currentLanguage === 'hindi' ? 'वात-कफ प्रधान' : 'Vata-Kapha Dominant';
                    dominantDosha = 'vata-kapha';
                } else if (scores.pitta === scores.kapha && scores.pitta > scores.vata) {
                    resultText = currentLanguage === 'hindi' ? 'पित्त-कफ प्रधान' : 'Pitta-Kapha Dominant';
                    dominantDosha = 'pitta-kapha';
                } else {
                    resultText = currentLanguage === 'hindi' ? 'द्विदोष' : 'Dual-Dosha';
                    dominantDosha = 'mixed';
                }
                description = content[currentLanguage].descriptions.mixed;
            }

            gunaResult.innerHTML = `<p>${resultText}</p>`;
            gunaDescription.innerHTML = `<p>${description}</p>`;
            
            // Show suggestions for physical test
            showSuggestions(currentTestType, dominantDosha);

        } else {
            // Emotions test results (Sattva, Rajas, Tamas)
            sattvaScoreEl.textContent = scores.sattva;
            rajasScoreEl.textContent = scores.rajas;
            tamasScoreEl.textContent = scores.tamas;
            
            sattvaBar.style.width = `${percentages.sattva}%`;
            rajasBar.style.width = `${percentages.rajas}%`;
            tamasBar.style.width = `${percentages.tamas}%`;
            
            sattvaPercentage.textContent = `${percentages.sattva}%`;
            rajasPercentage.textContent = `${percentages.rajas}%`;
            tamasPercentage.textContent = `${percentages.tamas}%`;

            // Reset labels to Sattva/Rajas/Tamas
            document.getElementById('sattvaText').textContent = content[currentLanguage].sattvaText;
            document.getElementById('rajasText').textContent = content[currentLanguage].rajasText;
            document.getElementById('tamasText').textContent = content[currentLanguage].tamasText;

            // Determine primary guna
            const maxScore = Math.max(scores.sattva, scores.rajas, scores.tamas);
            let resultText = '';
            let description = '';
            let dominantGuna = '';

            if (scores.sattva === scores.rajas && scores.rajas === scores.tamas) {
                resultText = `${content[currentLanguage].balanced}`;
                description = content[currentLanguage].descriptions.balanced;
                dominantGuna = 'balanced';
            } else if (scores.sattva > scores.rajas && scores.sattva > scores.tamas) {
                resultText = `${content[currentLanguage].sattvaDominant}`;
                description = content[currentLanguage].descriptions.sattva;
                dominantGuna = 'sattva';
            } else if (scores.rajas > scores.sattva && scores.rajas > scores.tamas) {
                resultText = `${content[currentLanguage].rajasDominant}`;
                description = content[currentLanguage].descriptions.rajas;
                dominantGuna = 'rajas';
            } else if (scores.tamas > scores.sattva && scores.tamas > scores.rajas) {
                resultText = `${content[currentLanguage].tamasDominant}`;
                description = content[currentLanguage].descriptions.tamas;
                dominantGuna = 'tamas';
            } else {
                // Dual guna conditions
                if (scores.sattva === scores.rajas && scores.sattva > scores.tamas) {
                    resultText = currentLanguage === 'hindi' ? 'सत्व-रज प्रधान' : 'Sattva-Rajas Dominant';
                    dominantGuna = 'sattva-rajas';
                } else if (scores.sattva === scores.tamas && scores.sattva > scores.rajas) {
                    resultText = currentLanguage === 'hindi' ? 'सत्व-तम प्रधान' : 'Sattva-Tamas Dominant';
                    dominantGuna = 'sattva-tamas';
                } else if (scores.rajas === scores.tamas && scores.rajas > scores.sattva) {
                    resultText = currentLanguage === 'hindi' ? 'रज-तम प्रधान' : 'Rajas-Tamas Dominant';
                    dominantGuna = 'rajas-tamas';
                } else {
                    resultText = `${content[currentLanguage].mixed}`;
                    dominantGuna = 'mixed';
                }
                description = content[currentLanguage].descriptions.mixed;
            }

            gunaResult.innerHTML = `<p>${resultText}</p>`;
            gunaDescription.innerHTML = `<p>${description}</p>`;
            
            // Show suggestions for emotions test
            showSuggestions(currentTestType, dominantGuna);
        }
        
        // Hide quiz and show results
        quizForm.style.display = 'none';
        document.querySelector('.navigation-buttons').style.display = 'none';
        document.querySelector('.progress-container').style.display = 'none';
        document.querySelector('.question-counter').style.display = 'none';
        resultContainer.style.display = 'block';
    }

    // Show suggestions based on test type and result
    function showSuggestions(testType, result) {
        suggestionsTitle.textContent = currentLanguage === 'hindi' ? 'आपके लिए सुझाव' : 'Suggestions for You';
        
        let suggestionsHTML = '';
        
        if (testType === 'physical') {
            // Physical test suggestions
            if (result.includes('vata')) {
                suggestionsHTML = `
                    <div class="suggestion-category">
                        <h4>${currentLanguage === 'hindi' ? 'आहार सुझाव' : 'Diet Suggestions'}</h4>
                        <ul>
                            <li>${content[currentLanguage].suggestions.vata.diet}</li>
                            <li>${currentLanguage === 'hindi' ? 'गर्म पानी और हर्बल चाय' : 'Warm water and herbal tea'}</li>
                            <li>${currentLanguage === 'hindi' ? 'पके हुए फल और सब्जियाँ' : 'Cooked fruits and vegetables'}</li>
                        </ul>
                    </div>
                    <div class="suggestion-category">
                        <h4>${currentLanguage === 'hindi' ? 'जीवनशैली सुझाव' : 'Lifestyle Suggestions'}</h4>
                        <ul>
                            <li>${content[currentLanguage].suggestions.vata.lifestyle}</li>
                            <li>${currentLanguage === 'hindi' ? 'गर्म तेल से मालिश' : 'Oil massage with warm oil'}</li>
                            <li>${currentLanguage === 'hindi' ? 'नियमित नींद का समय' : 'Regular sleep schedule'}</li>
                        </ul>
                    </div>
                    <div class="suggestion-category">
                        <h4>${currentLanguage === 'hindi' ? 'गतिविधि सुझाव' : 'Activity Suggestions'}</h4>
                        <ul>
                            <li>${content[currentLanguage].suggestions.vata.activities}</li>
                            <li>${currentLanguage === 'hindi' ? 'योग: बालासन, शवासन' : 'Yoga: Balasana, Shavasana'}</li>
                            <li>${currentLanguage === 'hindi' ? 'प्राणायाम: नाड़ी शोधन' : 'Pranayama: Nadi Shodhana'}</li>
                        </ul>
                    </div>
                `;
            } else if (result.includes('pitta')) {
                suggestionsHTML = `
                    <div class="suggestion-category">
                        <h4>${currentLanguage === 'hindi' ? 'आहार सुझाव' : 'Diet Suggestions'}</h4>
                        <ul>
                            <li>${content[currentLanguage].suggestions.pitta.diet}</li>
                            <li>${currentLanguage === 'hindi' ? 'मीठे और रसीले फल' : 'Sweet and juicy fruits'}</li>
                            <li>${currentLanguage === 'hindi' ? 'हरी पत्तेदार सब्जियाँ' : 'Green leafy vegetables'}</li>
                        </ul>
                    </div>
                    <div class="suggestion-category">
                        <h4>${currentLanguage === 'hindi' ? 'जीवनशैली सुझाव' : 'Lifestyle Suggestions'}</h4>
                        <ul>
                            <li>${content[currentLanguage].suggestions.pitta.lifestyle}</li>
                            <li>${currentLanguage === 'hindi' ? 'ठंडे पानी से स्नान' : 'Bathing with cool water'}</li>
                            <li>${currentLanguage === 'hindi' ? 'प्रकृति में शाम की सैर' : 'Evening walk in nature'}</li>
                        </ul>
                    </div>
                    <div class="suggestion-category">
                        <h4>${currentLanguage === 'hindi' ? 'गतिविधि सुझाव' : 'Activity Suggestions'}</h4>
                        <ul>
                            <li>${content[currentLanguage].suggestions.pitta.activities}</li>
                            <li>${currentLanguage === 'hindi' ? 'योग: चंद्रभेदी, शीतली' : 'Yoga: Chandra Bhedi, Sheetali'}</li>
                            <li>${currentLanguage === 'hindi' ? 'प्राणायाम: शीतकारी' : 'Pranayama: Sheetkari'}</li>
                        </ul>
                    </div>
                `;
            } else if (result.includes('kapha')) {
                suggestionsHTML = `
                    <div class="suggestion-category">
                        <h4>${currentLanguage === 'hindi' ? 'आहार सुझाव' : 'Diet Suggestions'}</h4>
                        <ul>
                            <li>${content[currentLanguage].suggestions.kapha.diet}</li>
                            <li>${currentLanguage === 'hindi' ? 'हल्का और सूखा भोजन' : 'Light and dry food'}</li>
                            <li>${currentLanguage === 'hindi' ? 'गर्म मसाले वाला भोजन' : 'Food with warm spices'}</li>
                        </ul>
                    </div>
                    <div class="suggestion-category">
                        <h4>${currentLanguage === 'hindi' ? 'जीवनशैली सुझाव' : 'Lifestyle Suggestions'}</h4>
                        <ul>
                            <li>${content[currentLanguage].suggestions.kapha.lifestyle}</li>
                            <li>${currentLanguage === 'hindi' ? 'सुबह जल्दी उठना' : 'Wake up early in morning'}</li>
                            <li>${currentLanguage === 'hindi' ? 'सक्रिय और गतिशील रहना' : 'Stay active and dynamic'}</li>
                        </ul>
                    </div>
                    <div class="suggestion-category">
                        <h4>${currentLanguage === 'hindi' ? 'गतिविधि सुझाव' : 'Activity Suggestions'}</h4>
                        <ul>
                            <li>${content[currentLanguage].suggestions.kapha.activities}</li>
                            <li>${currentLanguage === 'hindi' ? 'योग: सूर्य नमस्कार, कपालभाति' : 'Yoga: Surya Namaskar, Kapalbhati'}</li>
                            <li>${currentLanguage === 'hindi' ? 'प्राणायाम: भस्त्रिका' : 'Pranayama: Bhastrika'}</li>
                        </ul>
                    </div>
                `;
            } else if (result === 'balanced') {
                suggestionsHTML = `
                    <div class="suggestion-category">
                        <h4>${currentLanguage === 'hindi' ? 'सामान्य सुझाव' : 'General Suggestions'}</h4>
                        <ul>
                            <li>${currentLanguage === 'hindi' ? 'संतुलित आहार जारी रखें' : 'Continue balanced diet'}</li>
                            <li>${currentLanguage === 'hindi' ? 'नियमित व्यायाम करें' : 'Do regular exercise'}</li>
                            <li>${currentLanguage === 'hindi' ? 'तनाव मुक्त रहें' : 'Stay stress-free'}</li>
                        </ul>
                    </div>
                `;
            }
        } else {
            // Emotions test suggestions
            if (result.includes('sattva')) {
                suggestionsHTML = `
                    <div class="suggestion-category">
                        <h4>${currentLanguage === 'hindi' ? 'आहार सुझाव' : 'Diet Suggestions'}</h4>
                        <ul>
                            <li>${content[currentLanguage].suggestions.sattva.diet}</li>
                            <li>${currentLanguage === 'hindi' ? 'ताजे और प्राकृतिक भोजन' : 'Fresh and natural food'}</li>
                            <li>${currentLanguage === 'hindi' ? 'शाकाहारी आहार' : 'Vegetarian diet'}</li>
                        </ul>
                    </div>
                    <div class="suggestion-category">
                        <h4>${currentLanguage === 'hindi' ? 'जीवनशैली सुझाव' : 'Lifestyle Suggestions'}</h4>
                        <ul>
                            <li>${content[currentLanguage].suggestions.sattva.lifestyle}</li>
                            <li>${currentLanguage === 'hindi' ? 'सकारात्मक सोच' : 'Positive thinking'}</li>
                            <li>${currentLanguage === 'hindi' ? 'आत्म-चिंतन और आत्म-ज्ञान' : 'Self-reflection and self-knowledge'}</li>
                        </ul>
                    </div>
                    <div class="suggestion-category">
                        <h4>${currentLanguage === 'hindi' ? 'गतिविधि सुझाव' : 'Activity Suggestions'}</h4>
                        <ul>
                            <li>${content[currentLanguage].suggestions.sattva.activities}</li>
                            <li>${currentLanguage === 'hindi' ? 'ध्यान और प्रार्थना' : 'Meditation and prayer'}</li>
                            <li>${currentLanguage === 'hindi' ? 'ज्ञानवर्धक कार्यक्रम' : 'Knowledge-enhancing programs'}</li>
                        </ul>
                    </div>
                `;
            } else if (result.includes('rajas')) {
                suggestionsHTML = `
                    <div class="suggestion-category">
                        <h4>${currentLanguage === 'hindi' ? 'आहार सुझाव' : 'Diet Suggestions'}</h4>
                        <ul>
                            <li>${content[currentLanguage].suggestions.rajas.diet}</li>
                            <li>${currentLanguage === 'hindi' ? 'संतुलित और पौष्टिक भोजन' : 'Balanced and nutritious food'}</li>
                            <li>${currentLanguage === 'hindi' ? 'नियमित भोजन समय' : 'Regular meal times'}</li>
                        </ul>
                    </div>
                    <div class="suggestion-category">
                        <h4>${currentLanguage === 'hindi' ? 'जीवनशैली सुझाव' : 'Lifestyle Suggestions'}</h4>
                        <ul>
                            <li>${content[currentLanguage].suggestions.rajas.lifestyle}</li>
                            <li>${currentLanguage === 'hindi' ? 'समय प्रबंधन' : 'Time management'}</li>
                            <li>${currentLanguage === 'hindi' ? 'विश्राम और नींद' : 'Rest and sleep'}</li>
                        </ul>
                    </div>
                    <div class="suggestion-category">
                        <h4>${currentLanguage === 'hindi' ? 'गतिविधि सुझाव' : 'Activity Suggestions'}</h4>
                        <ul>
                            <li>${content[currentLanguage].suggestions.rajas.activities}</li>
                            <li>${currentLanguage === 'hindi' ? 'रचनात्मक शौक' : 'Creative hobbies'}</li>
                            <li>${currentLanguage === 'hindi' ? 'सामाजिक सेवा' : 'Social service'}</li>
                        </ul>
                    </div>
                `;
            } else if (result.includes('tamas')) {
                suggestionsHTML = `
                    <div class="suggestion-category">
                        <h4>${currentLanguage === 'hindi' ? 'आहार सुझाव' : 'Diet Suggestions'}</h4>
                        <ul>
                            <li>${content[currentLanguage].suggestions.tamas.diet}</li>
                            <li>${currentLanguage === 'hindi' ? 'ताजा और हल्का भोजन' : 'Fresh and light food'}</li>
                            <li>${currentLanguage === 'hindi' ? 'प्रसंस्कृत भोजन से परहेज' : 'Avoid processed food'}</li>
                        </ul>
                    </div>
                    <div class="suggestion-category">
                        <h4>${currentLanguage === 'hindi' ? 'जीवनशैली सुझाव' : 'Lifestyle Suggestions'}</h4>
                        <ul>
                            <li>${content[currentLanguage].suggestions.tamas.lifestyle}</li>
                            <li>${currentLanguage === 'hindi' ? 'नियमित दिनचर्या' : 'Regular routine'}</li>
                            <li>${currentLanguage === 'hindi' ? 'सकारात्मक वातावरण' : 'Positive environment'}</li>
                        </ul>
                    </div>
                    <div class="suggestion-category">
                        <h4>${currentLanguage === 'hindi' ? 'गतिविधि सुझाव' : 'Activity Suggestions'}</h4>
                        <ul>
                            <li>${content[currentLanguage].suggestions.tamas.activities}</li>
                            <li>${currentLanguage === 'hindi' ? 'नियमित व्यायाम' : 'Regular exercise'}</li>
                            <li>${currentLanguage === 'hindi' ? 'प्रेरक लोगों के साथ समय' : 'Time with inspiring people'}</li>
                        </ul>
                    </div>
                `;
            } else if (result === 'balanced') {
                suggestionsHTML = `
                    <div class="suggestion-category">
                        <h4>${currentLanguage === 'hindi' ? 'सामान्य सुझाव' : 'General Suggestions'}</h4>
                        <ul>
                            <li>${currentLanguage === 'hindi' ? 'वर्तमान जीवनशैली जारी रखें' : 'Continue current lifestyle'}</li>
                            <li>${currentLanguage === 'hindi' ? 'संतुलन बनाए रखें' : 'Maintain balance'}</li>
                            <li>${currentLanguage === 'hindi' ? 'नियमित अभ्यास जारी रखें' : 'Continue regular practice'}</li>
                        </ul>
                    </div>
                `;
            }
        }
        
        suggestionsContent.innerHTML = suggestionsHTML;
        suggestionsContainer.style.display = 'block';
    }

    // Live markup: onclick="prevQuestion()" / "nextQuestion()" / "submitQuiz()".
    prevBtn.addEventListener('click', prevQuestion);
    nextBtn.addEventListener('click', nextQuestion);
    submitBtn.addEventListener('click', submitQuiz);

    initQuiz();
}
