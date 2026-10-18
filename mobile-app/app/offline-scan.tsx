import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Modal, ActivityIndicator, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Gift, ArrowRight, AlertCircle, CheckCircle, QrCode, BookOpen, Lightbulb, Sparkles, Crown, Store, Camera as CameraIcon, ImageIcon, Receipt, IndianRupee, User as UserIcon, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  BounceIn,
  ZoomIn,
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import LottieView from 'lottie-react-native';
import { giftApi, API_BASE_URL } from '@/services/api';

const { width, height } = Dimensions.get('window');
const Y = '#ffc107';

// ─── Thirukkural data ──────────────────────────────────────────────────────────
const KURALS = [
  { id: 1, title: 'கடவுள் வாழ்த்து', kural: 'ஆகர முதல எழுத்தெல்லாம் ஆதி\nபகவன் முதற்றே உலகு.', meaning: "எழுத்துகளுக்கெல்லாம் 'அ' எப்படி முதலாக இருக்கிறதோ, அதுபோல உலகத்திற்கும் இறைவனே முதன்மையானவன்.", explanation: 'எந்த ஒரு செயலையும் தொடங்கும்போது அதற்கான அடிப்படை முக்கியம். வாழ்க்கையில் நாம் சாதிக்க விரும்பினால், நல்ல எண்ணம், நல்ல நம்பிக்கை, நல்ல ஒழுக்கம் ஆகியவற்றை அடிப்படையாகக் கொண்டு தொடங்க வேண்டும்.' },
  { id: 2, title: 'கல்வியின் முக்கியத்துவம்', kural: 'கற்க கசடறக் கற்பவை கற்றபின்\nநிற்க அதற்குத் தக.', meaning: 'கற்க வேண்டியவற்றைத் தெளிவாகவும் குற்றமற்ற முறையிலும் கற்றுக்கொண்டு, கற்றதற்கு ஏற்ப வாழ்க்கையில் நடக்க வேண்டும்.', explanation: 'படிப்பது மட்டும் கல்வி அல்ல. கற்றதை வாழ்க்கையில் பயன்படுத்துவதுதான் உண்மையான கல்வி. அறிவு + செயல்பாடு = வெற்றி.' },
  { id: 3, title: 'அறிவுடையவரின் சிறப்பு', kural: 'அறிவுடையார் எல்லாம் உடையார்; அறிவிலார்\nஎன்னுடைய ரேனும் இலர்.', meaning: 'அறிவு உடையவர் எல்லாவற்றையும் உடையவர் போன்றவர்; அறிவில்லாதவர் எவ்வளவு செல்வம் வைத்திருந்தாலும் உண்மையில் ஒன்றும் இல்லாதவர் போன்றவர்.', explanation: 'பணம் இழந்தால் மீண்டும் சம்பாதிக்கலாம். ஆனால் அறிவையும் அனுபவத்தையும் வளர்த்துக் கொண்டால் வாழ்க்கையில் எந்த சூழ்நிலையையும் சமாளிக்க முடியும்.' },
  { id: 4, title: 'இனிய சொல்', kural: 'இன்சொல் இனிதீன்றல் காண்பான் எவன்கொலோ\nவன்சொல் வழங்குவது.', meaning: 'இனிமையான சொற்கள் நன்மையைத் தருவதை அறிந்த ஒருவர் ஏன் கடுமையான சொற்களைப் பேச வேண்டும்?', explanation: 'ஒரு நல்ல வார்த்தை ஒருவரின் மனதை உயர்த்தும். ஒரு கடுமையான வார்த்தை உறவையே உடைத்துவிடலாம். பேசுவதற்கு முன் யோசிப்பது மிகப்பெரிய அறிவு.' },
  { id: 5, title: 'நன்றி', kural: 'நன்றி மறப்பது நன்றன்று நன்றல்லது\nஅன்றே மறப்பது நன்று.', meaning: 'ஒருவர் செய்த நன்மையை மறப்பது நல்லதல்ல. ஆனால் ஒருவர் செய்த தீமையை உடனே மறந்துவிடுவது நல்லது.', explanation: 'நமக்கு உதவி செய்தவர்களை வாழ்நாள் முழுவதும் நினைவில் வைத்திருக்க வேண்டும். அதே நேரத்தில் பிறர் செய்த சிறிய தவறுகளை மனதில் வைத்துக்கொண்டு வாழக்கூடாது.' },
  { id: 6, title: 'முயற்சி', kural: 'முயற்சி திருவினை ஆக்கும் முயற்றின்மை\nஇன்மை புகுத்தி விடும்.', meaning: 'முயற்சி ஒருவரை உயர்வடையச் செய்யும்; முயற்சி இல்லாமை வறுமையையும் தோல்வியையும் ஏற்படுத்தும்.', explanation: 'திறமை இருந்தாலும் முயற்சி இல்லையென்றால் பயனில்லை. சிறிய முயற்சியை தினமும் தொடர்ந்து செய்வது பெரிய வெற்றியை உருவாக்கும்.' },
  { id: 7, title: 'கோபத்தை அடக்குதல்', kural: 'சினத்தைப் பொருளென்று கொண்டவன் கேடு\nநிலத்தறைந்தான் கைபிழையா தற்று.', meaning: 'கோபத்தைப் பெருமையாகக் கருதுபவன், தரையை அடித்துத் தன் கையையே காயப்படுத்திக் கொள்வதைப் போன்றவன்.', explanation: 'கோபத்தில் எடுக்கப்படும் முடிவுகள் பெரும்பாலும் நமக்கே பாதிப்பை ஏற்படுத்தும். கோபத்தை வெல்வது மற்றவரை வெல்வதைவிட பெரிய வெற்றி.' },
  { id: 8, title: 'நட்பு', kural: 'நட்பிற்கு வீற்றிருக்கை யாதெனின் கொட்பின்றி\nஒல்லும்வாய் ஊன்றும் நிலை.', meaning: 'நட்பு என்பது நண்பன் துன்பத்தில் இருக்கும்போது எந்த எதிர்பார்ப்பும் இல்லாமல் அவனுக்கு ஆதரவாக நிற்பது.', explanation: 'சந்தோஷத்தில் அனைவரும் நண்பர்களாக இருக்கலாம். ஆனால் கஷ்டத்தில் துணையாக நிற்பவர்தான் உண்மையான நண்பர்.' },
  { id: 9, title: 'பணிவு', kural: 'பணியுமாம் என்றும் பெருமை சிறுமை\nஅணியுமாம் தன்னை வியந்து.', meaning: 'பெரியவர்கள் எப்போதும் பணிவுடன் இருப்பார்கள்; சிறியவர்கள் தங்களைத் தாங்களே பெருமைப்படுத்திக் கொள்வார்கள்.', explanation: 'உயர்ந்த பதவி, பணம், புகழ் வந்தாலும் பணிவை இழக்கக்கூடாது. உண்மையான உயர்வு என்பது பணிவுடன் இருப்பது.' },
  { id: 10, title: 'காலத்தை அறிதல்', kural: 'ஞாலம் கருதினும் கைகூடும் காலம்\nகருதி இடத்தாற் செயின்.', meaning: 'சரியான காலத்தையும் இடத்தையும் அறிந்து செயல்பட்டால் உலகையே வெல்ல நினைத்தாலும் அது சாத்தியமாகும்.', explanation: 'வெற்றிக்கு உழைப்பு மட்டும் போதாது. சரியான நேரத்தில் சரியான முடிவு எடுப்பதும் அவசியம்.' },
  { id: 11, title: 'நல்லவர்களுடன் பழகுதல்', kural: 'அரியவற்றுள் எல்லாம் அரிதே பெரியாரைப்\nபேணித் தமராக் கொளல்.', meaning: 'உயர்ந்த பண்பும் அறிவும் கொண்ட பெரியோரை மதித்து, அவர்களை நமக்கு நெருக்கமானவர்களாகக் கொள்வது மிகவும் அரிய சிறப்பு.', explanation: 'நாம் யாருடன் பழகுகிறோம் என்பது நம் வாழ்க்கையை மாற்றும். நல்ல சிந்தனை கொண்டவர்களுடன் பழகினால் நமது சிந்தனையும் உயர்வடையும்.' },
  { id: 12, title: 'கேள்வி அறிவு', kural: 'செல்வத்துள் செல்வம் செவிச்செல்வம் அச்செல்வம்\nசெல்வத்துள் எல்லாம் தலை.', meaning: 'செல்வங்களில் சிறந்த செல்வம் கேள்வி மூலம் பெறும் அறிவு. அது மற்ற எல்லாச் செல்வங்களிலும் உயர்ந்தது.', explanation: 'பணம், சொத்து போன்றவை குறையலாம். ஆனால் ஒருவர் கேட்டு கற்ற அறிவு வாழ்நாள் முழுவதும் அவருக்கு உதவும்.' },
  { id: 13, title: 'நல்ல சொற்களின் பயன்', kural: 'சொல்லுக சொல்லைப் பிறிதோர்சொல் அச்சொல்லை\nவெல்லுஞ்சொல் இன்மை அறிந்து.', meaning: 'நாம் சொல்லும் வார்த்தையைவிட சிறந்த வார்த்தை வேறு இல்லை என்பதை அறிந்து, சரியான வார்த்தையைப் பேச வேண்டும்.', explanation: 'பேச்சில் அவசரம் வேண்டாம். சரியான வார்த்தை சரியான நேரத்தில் பேசப்படும்போது அது பெரிய மாற்றத்தை ஏற்படுத்தும்.' },
  { id: 14, title: 'உண்மையான செல்வம்', kural: 'செல்வத்துள் செல்வம் செவிச்செல்வம் அச்செல்வம்\nசெல்வத்துள் எல்லாம் தலை.', meaning: 'கேட்டு அறியும் அறிவே எல்லாச் செல்வங்களிலும் சிறந்த செல்வம்.', explanation: 'தொழில் செய்பவர்களுக்கு இது மிகவும் முக்கியமான குறள். வாடிக்கையாளர் என்ன விரும்புகிறார் என்பதை கவனமாகக் கேட்பது கூட ஒரு பெரிய அறிவு.' },
  { id: 15, title: 'நல்ல செயல்', kural: 'செயற்கரிய செய்வார் பெரியர் சிறியர்\nசெயற்கரிய செய்கலா தார்.', meaning: 'செய்வதற்கு கடினமான நல்ல செயல்களைச் செய்து முடிப்பவர்களே பெரியவர்கள்; அவற்றைச் செய்ய முடியாதவர்கள் சிறியவர்கள்.', explanation: 'எளிதான காரியங்களைச் செய்வதால் பெரிய சாதனை கிடைக்காது. கடினமான நேரத்திலும் சரியான முடிவை எடுப்பதே மனிதனின் உண்மையான திறமை.' },
  { id: 16, title: 'விடாமுயற்சி', kural: 'இடுக்கண் வருங்கால் நகுக அதனை\nஅடுத்தூர்வது அஃதொப்பது இல்.', meaning: 'துன்பம் வரும்போது மனம் தளராமல் சிரித்துக்கொண்டு எதிர்கொள்ள வேண்டும்; துன்பத்தை வெல்ல அதைவிட சிறந்த வழி இல்லை.', explanation: '"இதையும் கடந்து செல்வேன்" என்ற மனநிலையுடன் கஷ்டம் வந்தவுடன் பயப்படாமல் இருக்க வேண்டும்.' },
  { id: 17, title: 'துணிவு', kural: 'எண்ணித் துணிக கருமம் துணிந்தபின்\nஎண்ணுவம் என்பது இழுக்கு.', meaning: 'ஒரு செயலைச் செய்வதற்கு முன் நன்றாக யோசிக்க வேண்டும். முடிவு செய்த பிறகு தயங்குவது தவறு.', explanation: 'முதலில் திட்டமிடு → பிறகு முடிவு செய் → முடிவு செய்தால் முழு நம்பிக்கையுடன் செயல்படு.' },
  { id: 18, title: 'தலைமைத்துவம்', kural: 'முறைசெய்து காப்பாற்றும் மன்னவன் மக்கட்கு\nஇறையென்று வைக்கப் படும்.', meaning: 'நியாயமாக ஆட்சி செய்து மக்களைக் காப்பாற்றும் தலைவன், மக்களால் இறைவனைப் போல மதிக்கப்படுவான்.', explanation: 'தலைவர் என்பவர் கட்டளையிடுபவர் மட்டும் அல்ல. தன்னுடன் இருப்பவர்களை பாதுகாத்து, அவர்களின் வளர்ச்சிக்கு உதவுபவரே சிறந்த தலைவர்.' },
  { id: 19, title: 'நல்லாட்சி', kural: 'குடிதழீஇக் கோலோச்சும் மாநில மன்னன்\nஅடிதழீஇ நிற்கும் உலகு.', meaning: 'மக்களை அன்புடன் காத்து நியாயமாக ஆட்சி செய்யும் தலைவனை உலகமே ஆதரிக்கும்.', explanation: 'ஊழியர்கள், வாடிக்கையாளர்கள், கூட்டாளிகள் ஆகியோரை மதிக்கும் நிறுவனமே நீண்ட காலம் வளர்ச்சி அடையும்.' },
  { id: 20, title: 'நம்பிக்கை', kural: 'வினைத்திட்பம் என்பது ஒருவன் மனத்திட்பம்\nமற்றைய எல்லாம் பிற.', meaning: 'ஒரு செயலை வெற்றிகரமாக முடிப்பதற்கான முக்கியமான வலிமை மன உறுதி; மற்றவை அனைத்தும் அதற்குப் பிறகுதான்.', explanation: 'வெற்றிக்கு பணம், திறமை, வாய்ப்பு ஆகியவை உதவும். ஆனால் மன உறுதி இல்லையென்றால் அவை எதுவும் முழுமையாகப் பயன்படாது.' },
];

// ─── Ambient twinkling sparkle ──────────────────────────────────────────────────
const TwinkleSparkle = ({ top, left, right, size = 14, delay = 0 }: any) => {
  const opacity = useSharedValue(0.2);
  useEffect(() => {
    opacity.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0.2, { duration: 900 })), -1));
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[{ position: 'absolute', top, left, right }, style]} pointerEvents="none">
      <Sparkles size={size} color="#D97706" />
    </Animated.View>
  );
};

// ─── Thirukkural Wait Screen ───────────────────────────────────────────────────
const ThirukkuralScreen = ({ isReady, onAwesome }: { isReady: boolean; onAwesome: () => void }) => {
  const [kural] = useState(() => KURALS[Math.floor(Math.random() * KURALS.length)]);
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(withSequence(withTiming(-8, { duration: 1400 }), withTiming(0, { duration: 1400 })), -1);
  }, []);
  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.kuralOuter}>
      <LinearGradient
        colors={['#FFF8E7', '#FFFFFF', '#FFF3D6']}
        style={StyleSheet.absoluteFillObject}
      />
      <Sparkles size={20} color="#D97706" style={{ position: 'absolute', top: 18, left: 36 }} />
      <Sparkles size={14} color="#D97706" style={{ position: 'absolute', top: 44, right: 44 }} />

      <Animated.View style={floatStyle}>
        <Image
          source={require('@/assets/images/gift.png')}
          style={{ width: 80, height: 80 }}
          contentFit="contain"
        />
      </Animated.View>

      <Animated.Text entering={FadeInDown.delay(150)} style={styles.kuralHeadline}>
        Your <Text style={{ color: Y }}>Gift</Text> is Ready!
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(250)} style={styles.kuralSubtext}>
        Here is a special Thirukkural for you 💛
      </Animated.Text>

      <Animated.View entering={FadeInUp.delay(350)} style={styles.kuralCard}>
        <View style={styles.kuralPill}>
          <Text style={styles.kuralPillText}>திருக்குறள்</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
          <View style={styles.kuralTitleRow}>
            <Text style={styles.kuralTitle}>{kural.title}</Text>
          </View>

          <Text style={styles.kuralText}>"{kural.kural}"</Text>

          <View style={styles.kuralSection}>
            <View style={styles.kuralSectionHeader}>
              <BookOpen size={14} color="#7C3AED" />
              <Text style={styles.kuralSectionLabel}>பொருள்</Text>
            </View>
            <Text style={styles.kuralSectionText}>{kural.meaning}</Text>
          </View>

          <View style={styles.kuralSection}>
            <View style={styles.kuralSectionHeader}>
              <Lightbulb size={14} color="#D97706" />
              <Text style={styles.kuralSectionLabel}>விளக்கம்</Text>
            </View>
            <Text style={styles.kuralSectionText}>{kural.explanation}</Text>
          </View>
        </ScrollView>
      </Animated.View>

      <TouchableOpacity
        onPress={isReady ? onAwesome : undefined}
        disabled={!isReady}
        activeOpacity={0.85}
        style={[styles.kuralBtn, !isReady && { opacity: 0.6 }]}
      >
        {isReady ? (
          <>
            <Text style={styles.kuralBtnText}>Awesome!</Text>
            <ArrowRight size={18} color="#1a0a2e" />
          </>
        ) : (
          <>
            <ActivityIndicator size="small" color="#1a0a2e" />
            <Text style={styles.kuralBtnText}>Preparing your gift...</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Won Screen — premium fireworks celebration ────────────────────────────────
const WonScreen = ({ giftResult, onClose }: any) => {
  const podiumGlow = useSharedValue(0.4);
  const imageGlow  = useSharedValue(0);
  const btnScale   = useSharedValue(1);

  useEffect(() => {
    podiumGlow.value = withRepeat(withSequence(withTiming(0.75, { duration: 1400 }), withTiming(0.4, { duration: 1400 })), -1);
    imageGlow.value   = withDelay(700, withTiming(1, { duration: 500 }));
  }, []);

  const podiumGlowStyle = useAnimatedStyle(() => ({ opacity: podiumGlow.value }));
  const imageGlowStyle  = useAnimatedStyle(() => ({ opacity: imageGlow.value }));
  const btnPressStyle   = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const handlePressIn  = () => { btnScale.value = withTiming(0.96, { duration: 100 }); };
  const handlePressOut = () => { btnScale.value = withTiming(1, { duration: 150 }); };

  const handleClaim = async () => {
    const playStoreId = 'com.srikrishnadigital.app';
    try {
      const supported = await Linking.canOpenURL(`market://details?id=${playStoreId}`);
      await Linking.openURL(
        supported
          ? `market://details?id=${playStoreId}`
          : `https://play.google.com/store/apps/details?id=${playStoreId}`
      );
    } catch (err) {
      // Ignore — don't block the user from closing the popup if the store can't be opened
    }
    onClose();
  };

  const hasPrice = !!giftResult.price;

  return (
    <View style={styles.wonScreen}>
      <LinearGradient
        colors={['#FFF8E7', '#FFFFFF', '#FFF3D6']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Fireworks — upper area, play once on entry */}
      <View style={styles.wonFireworksLottie} pointerEvents="none">
        <LottieView
          source={require('@/assets/animations/crackers.json')}
          autoPlay
          loop
          resizeMode="cover"
          speed={0.8}
          style={{ width: '100%', height: '100%' }}
        />
      </View>

      {/* Ambient twinkle */}
      <TwinkleSparkle top={120} left={30} size={16} delay={100} />
      <TwinkleSparkle top={200} right={24} size={12} delay={400} />
      <TwinkleSparkle top={320} left={20} size={10} delay={700} />

      <ScrollView
        contentContainerStyle={styles.wonScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={ZoomIn.delay(150).duration(500)} style={{ alignItems: 'center' }}>
          <Crown size={30} color="#D97706" fill="#FFD700" style={{ marginBottom: 6 }} />
          <Text style={styles.wonHeadline}>CONGRATULATIONS!</Text>
          <Text style={styles.wonSubhead}>You've won a special gift! 🎉</Text>
        </Animated.View>

        {/* Product showcase */}
        <Animated.View entering={ZoomIn.delay(700).duration(600).springify()} style={styles.podiumWrap}>
          <Animated.View style={[styles.podiumGlow, podiumGlowStyle]} />
          <Animated.View style={[styles.imageGlowRing, imageGlowStyle]} />

          <Image
            source={giftResult.image
              ? { uri: `${API_BASE_URL}${giftResult.image.startsWith('/') ? '' : '/'}${giftResult.image}` }
              : require('@/assets/images/gift.png')}
            style={styles.wonProductImage}
            contentFit="contain"
          />

          <View style={styles.wonFreeBadge}>
            <Gift size={12} color="#fff" />
            <Text style={styles.wonFreeBadgeText}>FREE</Text>
          </View>
        </Animated.View>

        {/* Prize details */}
        <Animated.Text entering={FadeInUp.delay(950).duration(450)} style={styles.wonProductName} numberOfLines={2}>
          {giftResult.productName || 'Surprise Gift'}
        </Animated.Text>
        {hasPrice && (
          <Animated.View entering={FadeInUp.delay(1050).duration(450)} style={styles.wonWorthBadge}>
            <Text style={styles.wonWorthText}>
              Worth ₹{parseFloat(giftResult.price).toLocaleString('en-IN')}
            </Text>
          </Animated.View>
        )}

        {/* Redemption instructions */}
        <Animated.View entering={FadeInUp.delay(1150).duration(450)} style={styles.wonInfoCard}>
          <Store size={18} color="#D97706" />
          <Text style={styles.wonInfoText}>Show this screen to the shopkeeper to claim your gift!</Text>
        </Animated.View>

        {/* Claim button */}
        <Animated.View entering={FadeInUp.delay(1300).duration(450)} style={{ width: '100%', marginTop: 24 }}>
          <Animated.View style={btnPressStyle}>
            <TouchableOpacity
              onPress={handleClaim}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.92}
              style={styles.wonClaimBtnShadow}
            >
              <LinearGradient
                colors={['#F6A800', '#E8760A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.wonClaimBtn}
              >
                <Star size={18} color="#fff" fill="#fff" strokeWidth={2.25} />
                <Text style={styles.wonClaimBtnText}>Give Your Valuable Review</Text>
                <ArrowRight size={18} color="#fff" strokeWidth={2.25} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

// ─── Lost Screen ──────────────────────────────────────────────────────────────
const LostScreen = ({ onClose }: any) => {
  const shake = useSharedValue(0);
  useEffect(() => {
    shake.value = withDelay(200, withSequence(
      withTiming(10, { duration: 60 }), withTiming(-10, { duration: 60 }),
      withTiming(8,  { duration: 60 }), withTiming(-8,  { duration: 60 }),
      withTiming(5,  { duration: 60 }), withTiming(0,   { duration: 60 }),
    ));
  }, []);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  return (
    <Animated.View entering={ZoomIn.duration(400)} style={styles.resultCard}>
      <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
        <X size={18} color="#64748B" />
      </TouchableOpacity>

      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={{ position: 'absolute', top: -40, left: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: '#F8F9FA', opacity: 0.8 }} />
      </View>

      <Animated.View style={[{ marginTop: 16 }, shakeStyle]}>
        <Text style={{ fontSize: 72 }}>😔</Text>
      </Animated.View>

      <Animated.Text entering={FadeInDown.delay(200)} style={[styles.wonLabel, { color: '#4B5563' }]}>
        Oh no!
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(350)} style={{ fontSize: 15, color: '#6B7280', textAlign: 'center', paddingHorizontal: 30, marginTop: 8, marginBottom: 28, lineHeight: 22 }}>
        Better luck next time! You didn't win a gift today. Come back and try again tomorrow!
      </Animated.Text>

      <Animated.View entering={FadeInUp.delay(450)} style={{ width: '100%' }}>
        <TouchableOpacity onPress={onClose} style={[styles.wonBtn, { backgroundColor: '#4B5563' }]} activeOpacity={0.85}>
          <Text style={styles.wonBtnText}>Okay, Got It</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

// ─── Info Screen (already scanned / wrong QR / error) ────────────────────────
const InfoScreen = ({ icon: Icon, iconColor, title, message, btnText, onPress, btnColor = '#1F2937' }: any) => (
  <Animated.View entering={SlideInDown.duration(400).springify()} style={styles.resultCard}>
    <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
      <Animated.View entering={BounceIn.delay(200)}>
        <Icon size={56} color={iconColor} />
      </Animated.View>
    </View>
    <Animated.Text entering={FadeInDown.delay(300)} style={[styles.wonLabel, { color: '#111827', fontSize: 22 }]}>{title}</Animated.Text>
    <Animated.Text entering={FadeInDown.delay(400)} style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 24, marginTop: 8, marginBottom: 28, lineHeight: 21 }}>{message}</Animated.Text>
    <Animated.View entering={FadeInUp.delay(500)} style={{ width: '100%' }}>
      <TouchableOpacity onPress={onPress} style={[styles.wonBtn, { backgroundColor: btnColor }]} activeOpacity={0.85}>
        <Text style={styles.wonBtnText}>{btnText}</Text>
      </TouchableOpacity>
    </Animated.View>
  </Animated.View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function OfflineScanScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanningStatus, setScanningStatus] = useState<'idle' | 'scanning' | 'won' | 'lost' | 'error' | 'already_scanned' | 'wrong_qr'>('idle');
  const [giftResult, setGiftResult] = useState<any>(null);
  const [kuralDismissed, setKuralDismissed] = useState(false);

  // Pre-scan details: bill number, purchased amount, and a profile photo (only if the user doesn't have one yet)
  const hasExistingProfileImage = !!(user?.profileImage && user.profileImage !== 'null');
  const [detailsReady, setDetailsReady] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  // Re-fetch the latest user record on open so a stale cached profileImage never lets
  // someone skip the photo step when they actually don't have one on file yet.
  useEffect(() => {
    refreshUser().finally(() => setProfileChecked(true));
  }, []);

  useEffect(() => {
    if (__DEV__ && profileChecked) {
      console.log('[offline-scan profile check]', { profileImage: user?.profileImage, hasExistingProfileImage });
    }
  }, [profileChecked, user?.profileImage]);
  const [billNumber, setBillNumber] = useState('');
  const [purchasedAmount, setPurchasedAmount] = useState('');
  const [capturedImage, setCapturedImage] = useState<any>(null);
  const [showInAppCamera, setShowInAppCamera] = useState(false);
  const photoCameraRef = useRef<CameraView>(null);
  const [photoFacing, setPhotoFacing] = useState<'front' | 'back'>('front');

  const openInAppCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Permission needed', 'Please allow camera access to continue.');
        return;
      }
    }
    setShowInAppCamera(true);
  };

  const captureProfilePhoto = async () => {
    if (!photoCameraRef.current) return;
    try {
      const photo = await photoCameraRef.current.takePictureAsync({ quality: 0.8 });
      setCapturedImage({ uri: photo.uri });
      setShowInAppCamera(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const pickImageFrom = async (source: 'gallery') => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (perm.status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to continue.');
      return;
    }

    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1] as [number, number],
      quality: 0.8,
    };

    const result = await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled) {
      setCapturedImage(result.assets[0]);
    }
  };

  const canContinue = profileChecked
    && billNumber.trim().length > 0
    && parseFloat(purchasedAmount) > 0
    && (hasExistingProfileImage || !!capturedImage);

  const handleContinue = () => {
    if (!billNumber.trim()) {
      Alert.alert('Bill number required', 'Please enter the bill number before scanning.');
      return;
    }
    if (!(parseFloat(purchasedAmount) > 0)) {
      Alert.alert('Purchased amount required', 'Please enter a valid purchase amount before scanning.');
      return;
    }
    if (!hasExistingProfileImage && !capturedImage) {
      Alert.alert('Profile photo required', 'Please capture or choose a profile photo before scanning.');
      return;
    }
    setDetailsReady(true);
  };

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) return <View style={styles.container}><ActivityIndicator color={Y} size="large" /></View>;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', color: '#1F2937', marginBottom: 16, fontSize: 15 }}>Camera permission is required to scan the QR code.</Text>
        <TouchableOpacity onPress={requestPermission} style={{ backgroundColor: Y, padding: 14, borderRadius: 12, marginBottom: 12, paddingHorizontal: 32 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#6B7280', marginTop: 8 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: any) => {
    if (scanningStatus !== 'idle') return;
    setKuralDismissed(false);
    setScanningStatus('scanning');

    try {
      // Run API call and 2-second timer simultaneously
      const [res] = await Promise.all([
        giftApi.scanOfflineGift({
          secretKey: data,
          billNumber,
          purchasedAmount,
          profileImage: hasExistingProfileImage ? null : capturedImage,
        }),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
      
      if (res.success) {
        // A new profile photo may have just been uploaded — refresh the auth user so it shows elsewhere immediately
        if (!hasExistingProfileImage && capturedImage) {
          refreshUser().catch(() => {});
          queryClient.invalidateQueries({ queryKey: ['me'] });
        }
        if (res.status === 'won') { setGiftResult(res.gift); setScanningStatus('won'); }
        else if (res.status === 'lost') setScanningStatus('lost');
      } else {
        resolveScanFailure(res.code, res.message);
      }
    } catch (err: any) {
      // Even on error, wait out the remaining time if it failed too quickly
      // (Simple delay here as fallback)
      await new Promise(resolve => setTimeout(resolve, 1000));

      resolveScanFailure(err.response?.data?.code, err.response?.data?.message || err.message);
    }
  };

  const resolveScanFailure = (code?: string, message?: string) => {
    const msg = message || '';
    if (code === 'ALREADY_SCANNED' || msg.includes('already scanned')) {
      setScanningStatus('already_scanned');
    } else if (code === 'INVALID_QR' || msg.includes('Invalid QR code')) {
      setScanningStatus('wrong_qr');
    } else if (code === 'BILL_NUMBER_REQUIRED' || code === 'AMOUNT_REQUIRED' || code === 'PHOTO_REQUIRED') {
      // These are caught by the client-side form already — if the server still rejects, send the
      // user back to the details form (not a dead-end error screen) with a clear reason.
      setScanningStatus('idle');
      Alert.alert('Missing details', msg || 'Please fill in all the required details before scanning.');
    } else {
      setScanningStatus('error');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient
        colors={['#FFF8E7', '#FFFFFF', '#FFF3D6']}
        style={StyleSheet.absoluteFillObject}
      />

      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <X size={20} color="#1F2937" />
      </TouchableOpacity>

      {scanningStatus === 'idle' && !detailsReady && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.detailsScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.hero}>
              <Image
                source={require('@/assets/images/unlock_your_golden_gift.png')}
                style={styles.heroImage}
                contentFit="cover"
              />
            </View>

            <View style={styles.detailsCardWrap}>
            <View style={styles.detailsCardShadow}>
            <View style={styles.detailsCard}>
              <View style={styles.detailsTitleRow}>
                <View style={styles.detailsTitleIcon}>
                  <Receipt size={18} color="#D97706" />
                </View>
                <Text style={styles.detailsTitle}>Purchase Details</Text>
              </View>
              <Text style={styles.detailsSubtitle}>Fill these in before scanning the shop QR code</Text>

              <Text style={styles.detailsLabel}>Bill Number</Text>
              <View style={styles.detailsInputRow}>
                <View style={styles.detailsInputIconChip}>
                  <Receipt size={14} color="#D97706" />
                </View>
                <TextInput
                  value={billNumber}
                  onChangeText={setBillNumber}
                  placeholder="e.g. INV-1024"
                  placeholderTextColor="#9CA3AF"
                  style={styles.detailsInput}
                />
              </View>

              <Text style={styles.detailsLabel}>Purchased Amount</Text>
              <View style={styles.detailsInputRow}>
                <View style={styles.detailsInputIconChip}>
                  <IndianRupee size={14} color="#D97706" />
                </View>
                <TextInput
                  value={purchasedAmount}
                  onChangeText={setPurchasedAmount}
                  placeholder="e.g. 7500"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  style={styles.detailsInput}
                />
              </View>

              <Text style={styles.detailsLabel}>Profile Photo</Text>
              {!profileChecked ? (
                <View style={styles.profileOkRow}>
                  <ActivityIndicator size="small" color={Y} />
                  <Text style={styles.profileOkText}>Checking your profile...</Text>
                </View>
              ) : hasExistingProfileImage ? (
                <View style={styles.profileOkRow}>
                  <UserIcon size={16} color="#16A34A" />
                  <Text style={styles.profileOkText}>Using your existing profile photo</Text>
                  <CheckCircle size={18} color="#16A34A" />
                </View>
              ) : (
                <>
                  {capturedImage ? (
                    <View style={styles.photoPreviewRow}>
                      <Image source={{ uri: capturedImage.uri }} style={styles.photoPreview} contentFit="cover" />
                      <TouchableOpacity onPress={() => setCapturedImage(null)} style={styles.photoRemoveBtn}>
                        <X size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.photoBtnRow}>
                      <TouchableOpacity style={styles.photoBtn} onPress={openInAppCamera}>
                        <CameraIcon size={16} color={Y} />
                        <Text style={styles.photoBtnText}>Take Photo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.photoBtn} onPress={() => pickImageFrom('gallery')}>
                        <ImageIcon size={16} color={Y} />
                        <Text style={styles.photoBtnText}>Gallery</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}

              <TouchableOpacity
                onPress={handleContinue}
                disabled={!canContinue}
                activeOpacity={0.9}
                style={!canContinue ? { opacity: 0.5 } : undefined}
              >
                <LinearGradient
                  colors={['#6D28D9', '#4C1D95']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.continueBtn}
                >
                  <View style={styles.continueBtnIconChip}>
                    <QrCode size={16} color="#6D28D9" />
                  </View>
                  <Text style={styles.continueBtnText}>Continue to Scan</Text>
                  <ArrowRight size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
            </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {scanningStatus === 'idle' && detailsReady && (
        <View style={styles.hero}>
          <Image
            source={require('@/assets/images/unlock_your_golden_gift.png')}
            style={styles.heroImage}
            contentFit="cover"
          />
        </View>
      )}

      {scanningStatus === 'idle' && detailsReady && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
          <View style={styles.overlay}>
            {/* Dimmed areas around the scan box */}
            <View style={styles.scanTarget}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <View style={styles.scanTextPill}>
              <QrCode size={16} color={Y} />
              <Text style={styles.scanText}>Position the QR code within the frame</Text>
            </View>
          </View>
        </View>
      )}

      <Modal visible={scanningStatus !== 'idle'} transparent animationType="none">
        {scanningStatus !== 'idle' && !kuralDismissed ? (
          <ThirukkuralScreen
            isReady={scanningStatus !== 'scanning'}
            onAwesome={() => setKuralDismissed(true)}
          />
        ) : scanningStatus === 'won' && giftResult ? (
          <WonScreen giftResult={giftResult} onClose={() => router.back()} />
        ) : (
          <View style={styles.modalBg}>
            {scanningStatus === 'lost'            && <LostScreen onClose={() => router.back()} />}
            {scanningStatus === 'already_scanned' && (
              <InfoScreen
                icon={AlertCircle} iconColor="#F59E0B"
                title="Already Scanned"
                message="You have already scanned for a gift today. Come back tomorrow for another chance!"
                btnText="Got It"
                btnColor="#F59E0B"
                onPress={() => router.back()}
              />
            )}
            {scanningStatus === 'wrong_qr' && (
              <InfoScreen
                icon={AlertCircle} iconColor="#EF4444"
                title="Invalid QR Code"
                message="This is not a valid Sri Krishna Digital World gift QR. Please scan the official QR code at the shop!"
                btnText="Try Again"
                btnColor="#EF4444"
                onPress={() => setScanningStatus('idle')}
              />
            )}
            {scanningStatus === 'error' && (
              <InfoScreen
                icon={X} iconColor="#EF4444"
                title="Oops!"
                message="Something went wrong. Please try scanning again."
                btnText="Try Again"
                onPress={() => setScanningStatus('idle')}
              />
            )}
          </View>
        )}
      </Modal>

      {/* In-app camera for profile photo capture */}
      <Modal visible={showInAppCamera} animationType="slide" onRequestClose={() => setShowInAppCamera(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView ref={photoCameraRef} style={{ flex: 1 }} facing={photoFacing} />

          <TouchableOpacity
            onPress={() => setShowInAppCamera(false)}
            style={[styles.backBtn, { top: 48 }]}
          >
            <X size={20} color="#1F2937" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPhotoFacing(f => (f === 'front' ? 'back' : 'front'))}
            style={styles.flipCameraBtn}
          >
            <CameraIcon size={20} color="#fff" />
          </TouchableOpacity>

          <View style={styles.captureBtnRow}>
            <TouchableOpacity onPress={captureProfilePhoto} style={styles.captureBtnOuter}>
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#0a0a0a' },
  container:       { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  backBtn:         { position: 'absolute', top: 48, left: 16, zIndex: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  hero:            { width: '100%', aspectRatio: 2000 / 850 },
  heroImage:       { width: '100%', height: '100%' },
  cameraContainer: { flex: 1, position: 'relative' },
  overlay:         { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  scanTarget:      { width: width * 0.7, height: width * 0.7, backgroundColor: 'transparent', marginTop: -100 },
  corner:          { position: 'absolute', width: 44, height: 44, borderColor: Y },
  topLeft:         { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 20 },
  topRight:        { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 20 },
  bottomLeft:      { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 20 },
  bottomRight:     { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 20 },
  scanTextPill:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 36, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: 'rgba(255,193,7,0.4)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100 },
  scanText:        { color: '#fff', fontSize: 14, fontWeight: '600', letterSpacing: 0.2 },
  modalBg:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  resultCard:      { backgroundColor: '#fff', borderRadius: 32, alignItems: 'center', width: '100%', overflow: 'hidden', paddingHorizontal: 24, paddingBottom: 28, paddingTop: 16 },
  closeBtn:        { position: 'absolute', top: 16, right: 16, backgroundColor: '#F1F5F9', borderRadius: 20, padding: 8, zIndex: 10 },
  wonLabel:        { fontSize: 24, fontWeight: '900', color: '#EA580C', textAlign: 'center', marginTop: 12, letterSpacing: 0.3 },
  wonBtn:          { backgroundColor: '#EA580C', paddingVertical: 17, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, width: '100%' },
  wonBtnText:      { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },

  // Won screen — premium fireworks celebration
  wonScreen:          { flex: 1 },
  wonFireworksLottie: { position: 'absolute', top: -20, bottom: 0, left: -width * 0.35, width: width * 1.7, zIndex: 5 },
  wonScrollContent:   { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 70, paddingBottom: 40, paddingHorizontal: 24 },
  wonHeadline:        { fontSize: 28, fontWeight: '900', color: '#D97706', textAlign: 'center', letterSpacing: 1, textShadowColor: 'rgba(217,119,6,0.2)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  wonSubhead:         { fontSize: 14, color: '#78350F', marginTop: 6, textAlign: 'center' },
  podiumWrap:         { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginTop: 28, marginBottom: 8 },
  podiumGlow:         { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: '#FFD700', opacity: 0.35 },
  imageGlowRing:      { position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 2, borderColor: '#FFD700' },
  wonProductImage:    { width: 170, height: 170 },
  wonFreeBadge:       { position: 'absolute', bottom: 4, right: 4, backgroundColor: '#D92D91', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 2, borderColor: '#fff', elevation: 6, shadowColor: '#D92D91', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 6 },
  wonFreeBadgeText:   { color: '#fff', fontSize: 11, fontWeight: '900' },
  wonProductName:     { fontSize: 22, fontWeight: '900', color: '#1F2937', textAlign: 'center', marginTop: 10, paddingHorizontal: 8 },
  wonWorthBadge:      { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, marginTop: 10 },
  wonWorthText:       { color: '#92400E', fontWeight: '800', fontSize: 14 },
  wonInfoCard:        { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF8E7', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 16, padding: 14, marginTop: 24, width: '100%' },
  wonInfoText:        { flex: 1, color: '#78350F', fontSize: 10.5, lineHeight: 15 },
  wonClaimBtnShadow:  { borderRadius: 14, shadowColor: '#C2650A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  wonClaimBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, paddingHorizontal: 10, borderRadius: 14, width: '100%' },
  wonClaimBtnText:    { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.1, flexShrink: 1, textAlign: 'center' },

  // Thirukkural wait screen
  kuralOuter:        { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', paddingTop: 40, paddingBottom: 32, paddingHorizontal: 18 },
  kuralHeadline:     { color: '#1F2937', fontSize: 22, fontWeight: '900', marginTop: 14, textAlign: 'center' },
  kuralSubtext:      { color: '#6B7280', fontSize: 13, marginTop: 6, marginBottom: 18, textAlign: 'center' },
  kuralCard:         { width: '100%', backgroundColor: '#FFFBEF', borderRadius: 20, borderWidth: 1.5, borderColor: '#F3D98B', padding: 18 },
  kuralPill:         { alignSelf: 'center', backgroundColor: Y, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 5, marginBottom: 14, marginTop: -30 },
  kuralPillText:     { fontSize: 12, fontWeight: '800', color: '#1a0a2e', letterSpacing: 0.5 },
  kuralTitleRow:     { alignItems: 'center', marginBottom: 10 },
  kuralTitle:        { fontSize: 14, fontWeight: '800', color: '#78350F' },
  kuralText:         { fontSize: 12.5, fontWeight: '700', color: '#1F2937', textAlign: 'left', lineHeight: 18, marginBottom: 14 },
  kuralSection:      { marginBottom: 10 },
  kuralSectionHeader:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  kuralSectionLabel: { fontSize: 12, fontWeight: '800', color: '#4B5563' },
  kuralSectionText:  { fontSize: 12.5, color: '#4B5563', lineHeight: 18 },
  kuralBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Y, borderRadius: 100, paddingVertical: 14, width: '100%', marginTop: 20 },
  kuralBtnText:      { color: '#1a0a2e', fontSize: 15, fontWeight: '900' },

  // Pre-scan purchase details form
  detailsScroll:     { paddingBottom: 32 },
  detailsCardWrap:   { marginHorizontal: 18, marginTop: 20, marginBottom: 14, position: 'relative' },
  detailsCardShadow: { borderRadius: 24, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  detailsCard:       { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, overflow: 'hidden' },
  detailsTitleRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailsTitleIcon:  { width: 34, height: 34, borderRadius: 10, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  detailsTitle:      { color: '#1F2937', fontSize: 18, fontWeight: '900' },
  detailsSubtitle:   { color: '#6B7280', fontSize: 12.5, marginTop: 8, marginBottom: 18 },
  detailsLabel:      { color: '#4B5563', fontSize: 12.5, fontWeight: '700', marginBottom: 6, marginTop: 4 },
  detailsInputRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 14 },
  detailsInputIconChip: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  detailsInput:      { flex: 1, color: '#1F2937', fontSize: 14, paddingVertical: 12 },
  profileOkRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 12, padding: 12, marginBottom: 14 },
  profileOkText:     { color: '#15803D', fontSize: 12.5, flex: 1 },
  photoBtnRow:       { flexDirection: 'row', gap: 10, marginBottom: 14 },
  photoBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F3D98B', borderRadius: 12, paddingVertical: 12 },
  photoBtnText:      { color: '#92400E', fontSize: 12.5, fontWeight: '700' },
  photoPreviewRow:   { position: 'relative', alignSelf: 'flex-start', marginBottom: 14 },
  photoPreview:      { width: 72, height: 72, borderRadius: 12 },
  photoRemoveBtn:    { position: 'absolute', top: -6, right: -6, backgroundColor: '#EF4444', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  continueBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 100, paddingVertical: 14, width: '100%', marginTop: 6 },
  continueBtnIconChip: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  continueBtnText:   { color: '#fff', fontSize: 15, fontWeight: '900' },

  // In-app camera (profile photo capture)
  flipCameraBtn:     { position: 'absolute', top: 48, right: 16, zIndex: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  captureBtnRow:     { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  captureBtnOuter:   { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  captureBtnInner:   { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
});
