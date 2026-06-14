import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Linking,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Package,
  Truck,
  Check,
  Clock,
  BadgeCheck,
  Loader2,
  MapPin,
  Phone,
  User,
  ShoppingBag,
  CreditCard,
  ChevronRight,
  AlertCircle,
  X,
  ReceiptText,
  CalendarDays,
  Hash,
  MessageCircle,
  PhoneCall,
  Star,
} from 'lucide-react-native';
import Header from '@/components/Header';
import { useQuery } from '@tanstack/react-query';
import { orderApi, API_BASE_URL } from '@/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useShopInfo } from '@/contexts/ShopInfoContext';
import Skeleton from '@/components/Skeleton';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  Easing,
  withDelay,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// ─── Honey Yellow Theme ──────────────────────────────────────────────────────
const Y  = '#ffc107'; // honey yellow
const YL = '#fff9e6'; // soft butter
const YD = '#e6a800'; // dark honey

// ─── Status Config (matching web) ───────────────────────────────────────────
const STATUS_CONFIG: any = {
  pending:    { label: "Pending",    color: "#F97316", bg: "#FFF7ED", border: "#FDBA74", icon: Clock      },
  processing: { label: "Processing", color: Y,         bg: YL,        border: Y,         icon: Loader2    },
  shipped:    { label: "Shipped",    color: "#3B82F6", bg: "#EFF6FF", border: "#93C5FD", icon: Truck      },
  delivered:  { label: "Delivered",  color: "#10B981", bg: "#ECFDF5", border: "#6EE7B7", icon: BadgeCheck },
  cancelled:  { label: "Cancelled",  color: "#EF4444", bg: "#FEF2F2", border: "#FCA5A5", icon: X          },
};

const PAYMENT_STATUS_CONFIG: any = {
  pending:  { label: "Pending",  color: "#F97316", bg: "#FFF7ED" },
  paid:     { label: "Paid",     color: "#10B981", bg: "#ECFDF5" },
  failed:   { label: "Failed",   color: "#EF4444", bg: "#FEF2F2" },
  refunded: { label: "Refunded", color: Y,         bg: YL        },
};

const TRACK_STEPS = ["pending", "processing", "shipped", "delivered"];

// ─── Orbit Ring Animation ────────────────────────────────────────────────────
const OrbitRing = ({ radius, speed, delay, dotColor, reverse = false }: any) => {
  const rotation = useSharedValue(0);
  const scale    = useSharedValue(0.2);
  const opacity  = useSharedValue(0);

  useEffect(() => {
    rotation.value = withDelay(delay, withRepeat(withTiming(reverse ? -360 : 360, { duration: speed, easing: Easing.linear }), -1));
    scale.value    = withDelay(delay, withSpring(1));
    opacity.value  = withDelay(delay, withTiming(1, { duration: 600 }));
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        styles.orbitRing,
        { width: radius * 2, height: radius * 2, borderColor: `${dotColor}22` },
        ringStyle,
      ]}
    >
      <Animated.View style={[{ width: '100%', height: '100%', position: 'relative' }, dotStyle]}>
        <View style={[styles.orbitDot, { backgroundColor: dotColor, shadowColor: dotColor }]} />
      </Animated.View>
    </Animated.View>
  );
};

// ─── Tracking Timeline ───────────────────────────────────────────────────────
function TrackingTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx  = TRACK_STEPS.indexOf(currentStatus.toLowerCase());
  const isCancelled = currentStatus.toLowerCase() === "cancelled";

  return (
    <View style={styles.timelineContainer}>
      {/* Background Line */}
      <View style={styles.timelineLineBg} />
      
      {/* Active Progress Line */}
      {!isCancelled && (
        <Animated.View 
          entering={FadeIn.delay(400).duration(800)}
          style={[
            styles.timelineLineActive,
            { 
              width: `${(Math.max(0, currentIdx) / (TRACK_STEPS.length - 1)) * 100}%` 
            }
          ]} 
        />
      )}

      {/* Steps */}
      <View style={styles.timelineSteps}>
        {TRACK_STEPS.map((step, i) => {
          const done   = !isCancelled && i <= currentIdx;
          const active = !isCancelled && i === currentIdx;
          const cfg    = STATUS_CONFIG[step];
          const StepIcon = cfg.icon;

          return (
            <View key={step} style={styles.timelineStep}>
              <View
                style={[
                  styles.stepDot,
                  done ? { backgroundColor: Y, borderColor: Y } : { backgroundColor: '#fff', borderColor: '#e5e7eb' },
                  active && styles.stepDotActive
                ]}
              >
                {done && i < currentIdx ? (
                  <Check size={12} color="#fff" />
                ) : (
                  <StepIcon size={12} color={done ? '#fff' : '#9ca3af'} />
                )}
              </View>
              <Text style={[styles.stepLabel, done ? { color: Y, fontWeight: '700' } : { color: '#9ca3af' }]}>
                {cfg.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Section Card ────────────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, delay = 0, children }: any) {
  return (
    <Animated.View
      entering={FadeIn.delay(delay).duration(600)}
      style={styles.sectionCard}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconBox}>
          <Icon size={14} color={Y} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </Animated.View>
  );
}

// ─── Info Row ────────────────────────────────────────────────────────────────
function InfoRow({ label, value, highlight, mono }: any) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[
          styles.infoValue,
          highlight && { color: Y, fontWeight: '700' },
          mono && { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
        ]}
      >
        {value ?? "—"}
      </Text>
    </View>
  );
}

// ─── Product Image ───────────────────────────────────────────────────────────
function ProductImage({ item }: any) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    let url = null;
    if (item.image) {
      url = item.image;
    } else if (item.product?.colorsAndImages && item.colorName) {
      const colorImgs = item.product.colorsAndImages[item.colorName];
      if (colorImgs?.length) {
        const main = colorImgs.find((i: any) => i.type === "main");
        url = main?.url || colorImgs[0]?.url || null;
      }
    } else if (item.product?.images?.length) {
      const first = item.product.images[0];
      url = typeof first === "string" ? first : first?.url || null;
    }
    if (url && !url.startsWith('http')) {
        url = `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    }
    setImgSrc(url);
  }, [item]);

  return (
    <View style={styles.productImgContainer}>
      {imgSrc ? (
        <Image source={{ uri: imgSrc }} style={styles.productImg} />
      ) : (
        <Package size={24} color="#9ca3af" />
      )}
    </View>
  );
}

// ─── Cancel Request Popup ────────────────────────────────────────────────────
function CancelRequestPopup({ order, shopInfo, onClose }: any) {
  const phone    = shopInfo?.whatsappNumber || shopInfo?.phone || null;
  const shopName = shopInfo?.shopName || "the shop";

  const handleWhatsApp = () => {
    if (!phone) return;
    const msg = `Hi, I'd like to cancel my order.\n\nOrder Number: ${order.orderNumber || order.id}\nAmount: ₹${parseFloat(order.finalAmount).toLocaleString("en-IN")}\n\nPlease assist me with the cancellation.`;
    const url = `whatsapp://send?phone=${phone.replace(/\D/g, "")}&text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      // Fallback to web link if app not installed
      Linking.openURL(`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`);
    });
  };

  const handleCall = () => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/\s/g, "")}`);
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Animated.View 
          entering={FadeIn.duration(300)} 
          style={styles.modalContent}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <X size={14} color="#6b7280" />
            </TouchableOpacity>
            
            <View style={styles.modalIconBox}>
              <AlertCircle size={32} color="#ef4444" />
            </View>
            
            <Text style={styles.modalTitle}>Want to Cancel?</Text>
            <Text style={styles.modalSubtitle}>
              Orders can only be cancelled by our team. Please contact {shopName} and we'll process your request right away.
            </Text>
          </View>

          {/* Reference */}
          <View style={styles.modalRefBox}>
            <View>
              <Text style={styles.modalRefLabel}>Your order</Text>
              <Text style={styles.modalRefValue}>{order.orderNumber || `#${order.id}`}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.modalRefLabel}>Amount</Text>
              <Text style={[styles.modalRefValue, { color: Y }]}>₹{parseFloat(order.finalAmount).toLocaleString("en-IN")}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={handleWhatsApp} style={styles.actionBtnWhatsApp}>
              <MessageCircle size={20} color="#25D366" />
              <View style={{ flex: 1 }}>
                <Text style={styles.actionBtnText}>Message on WhatsApp</Text>
                <Text style={styles.actionBtnSubtext}>{phone}</Text>
              </View>
              <ChevronRight size={16} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleCall} style={styles.actionBtnCall}>
              <PhoneCall size={20} color={Y} />
              <View style={{ flex: 1 }}>
                <Text style={styles.actionBtnText}>Call Us</Text>
                <Text style={styles.actionBtnSubtext}>{phone}</Text>
              </View>
              <ChevronRight size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalFooter}>Keep your order number handy when you contact us.</Text>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { shopInfo } = useShopInfo();
  const [showCancelPopup, setShowCancelPopup] = useState(false);

  const { data: orderResponse, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.getOrderDetails(id),
  });

  const order = orderResponse?.data || orderResponse?.order || orderResponse;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <Header />
        <View style={{ padding: 16 }}>
          <Skeleton width={180} height={32} borderRadius={8} style={{ marginBottom: 20 }} />
          <View style={styles.statusHeroSkeleton}>
            <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: 16 }} />
            <Skeleton width={150} height={20} borderRadius={4} />
          </View>
          <View style={styles.sectionCardSkeleton}>
             <Skeleton width={width - 64} height={120} borderRadius={22} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) return null;

  const orderStatus   = order.orderStatus?.toLowerCase()   || "pending";
  const paymentStatus = order.paymentStatus?.toLowerCase() || "pending";
  const statusCfg     = STATUS_CONFIG[orderStatus]         || STATUS_CONFIG.pending;
  const paymentCfg    = PAYMENT_STATUS_CONFIG[paymentStatus] || PAYMENT_STATUS_CONFIG.pending;

  const canRequestCancel = ["pending", "processing"].includes(orderStatus);

  let shippingAddr = order.shippingAddress || {};
  if (typeof shippingAddr === 'string') {
    try { shippingAddr = JSON.parse(shippingAddr); } catch { shippingAddr = {}; }
  }

  let items = order.orderItems || [];
  if (typeof items === 'string') {
    try { items = JSON.parse(items); } catch { items = []; }
  }

  const StatusIcon = statusCfg.icon;

  const formatPrice = (p: any) => `₹${parseFloat(p).toLocaleString('en-IN')}`;
  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <Header />
      
      {showCancelPopup && (
        <CancelRequestPopup order={order} shopInfo={shopInfo} onClose={() => setShowCancelPopup(false)} />
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#111827" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderNumber}>
              {order.orderNumber || `ORD${String(order.id).slice(-6)}`}
            </Text>
            <Text style={styles.orderDate}>Placed on {formatDate(order.createdAt || order.created_at)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg, borderColor: statusCfg.border }]}>
            <StatusIcon size={12} color={statusCfg.color} />
            <Text style={[styles.statusBadgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        {/* Status Hero */}
        <View style={styles.statusHero}>
          <LinearGradient
            colors={['rgba(255,193,7,0.08)', 'rgba(255,193,7,0)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.orbitBox}>
            <OrbitRing radius={48} speed={8000}  delay={300} dotColor={Y} />
            <OrbitRing radius={68} speed={13000} delay={500} dotColor={Y} reverse />
            <OrbitRing radius={88} speed={19000} delay={700} dotColor="#d1d5db" />
            
            <Animated.View 
              entering={FadeIn.delay(100).duration(600)}
              style={[styles.heroIconBox, { backgroundColor: statusCfg.bg, borderColor: statusCfg.border }]}
            >
              <StatusIcon size={36} color={statusCfg.color} />
            </Animated.View>
          </View>

          <Text style={styles.heroStatusTitle}>
            {orderStatus === "delivered"  && "Your order has been delivered!"}
            {orderStatus === "shipped"    && "Your order is on the way!"}
            {orderStatus === "processing" && "Your order is being processed"}
            {orderStatus === "pending"    && "Your order is confirmed"}
            {orderStatus === "cancelled"  && "Order has been cancelled"}
          </Text>
          
          {order.trackingId ? (
            <Text style={styles.heroTrackingId}>
              Tracking ID: <Text style={{ color: Y, fontWeight: '700' }}>{order.trackingId}</Text>
            </Text>
          ) : null}

          {/* Timeline */}
          <View style={{ width: '100%', marginTop: 20 }}>
            <TrackingTimeline currentStatus={orderStatus} />
          </View>
        </View>

        {/* Order Items */}
        <SectionCard title="Order Items" icon={ShoppingBag} delay={150}>
           <View style={{ gap: 16 }}>
            {items.map((item: any, i: number) => (
              <View key={i} style={styles.itemRow}>
                <ProductImage item={item} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.name || item.product?.name || `Product #${item.productId}`}</Text>
                  <View style={styles.itemMeta}>
                    {item.colorName && <Text style={styles.itemMetaText}>Color: {item.colorName}</Text>}
                    <Text style={styles.itemMetaText}>Qty: {item.quantity}</Text>
                  </View>
                  <Text style={styles.itemPriceDetail}>{formatPrice(item.price)} × {item.quantity}</Text>
                </View>
                <Text style={styles.itemTotal}>{formatPrice(item.total || item.price * item.quantity)}</Text>
              </View>
            ))}
           </View>

           <View style={styles.priceBreakdown}>
             <InfoRow label="Subtotal" value={formatPrice(order.totalPrice)} />
             <InfoRow label="Shipping" value={parseFloat(order.shippingCost) > 0 ? formatPrice(order.shippingCost) : 'FREE'} highlight={parseFloat(order.shippingCost) === 0} />
             {parseFloat(order.discountAmount) > 0 && <InfoRow label="Discount" value={`- ${formatPrice(order.discountAmount)}`} highlight />}
             <View style={styles.totalRow}>
               <Text style={styles.totalLabel}>Total Amount</Text>
               <Text style={styles.totalValue}>{formatPrice(order.finalAmount)}</Text>
             </View>
           </View>
        </SectionCard>

        {/* Payment & Address Grid (implemented as stack on mobile) */}
        <SectionCard title="Payment Details" icon={CreditCard} delay={250}>
          <View style={styles.paymentMethodBox}>
             <View style={[styles.methodBadge, { backgroundColor: paymentCfg.bg }]}>
                <Text style={[styles.methodBadgeText, { color: paymentCfg.color }]}>{paymentCfg.label}</Text>
             </View>
             <View style={{ flex: 1 }}>
                <Text style={styles.methodTitle}>{order.paymentMethod?.toUpperCase()}</Text>
                <Text style={styles.methodSubtitle}>Payment Method</Text>
             </View>
          </View>
          <InfoRow label="Status" value={paymentCfg.label} />
          <InfoRow label="Ordered" value={formatDate(order.createdAt || order.created_at)} />
          {order.merchantOrderId && <InfoRow label="TransactionID" value={order.merchantOrderId} mono />}
        </SectionCard>

        <SectionCard title="Shipping Address" icon={MapPin} delay={350}>
           <View style={styles.addressBox}>
              <View style={styles.addressIconBox}>
                <User size={16} color={Y} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addressName}>{shippingAddr.name}</Text>
                <Text style={styles.addressText}>{shippingAddr.street}</Text>
                <Text style={styles.addressText}>{shippingAddr.city}, {shippingAddr.state} - {shippingAddr.zipCode}</Text>
                <View style={styles.addressPhone}>
                  <Phone size={12} color="#9ca3af" />
                  <Text style={styles.addressPhoneText}>{shippingAddr.phone}</Text>
                </View>
              </View>
           </View>
        </SectionCard>

        {/* Tracking Info Extra Card */}
        {(order.trackingId || order.estimatedDelivery) && (
          <SectionCard title="Tracking Info" icon={Truck} delay={450}>
            {order.trackingId && <InfoRow label="Tracking ID" value={order.trackingId} mono />}
            {order.estimatedDelivery && <InfoRow label="Est. Delivery" value={formatDate(order.estimatedDelivery)} highlight />}
            {orderStatus === "shipped" && (
              <View style={styles.trackAlert}>
                <Truck size={14} color={Y} />
                <Text style={styles.trackAlertText}>Your package is on its way!</Text>
              </View>
            )}
          </SectionCard>
        )}

        {/* Notes */}
        {order.notes && (
          <SectionCard title="Order Notes" icon={ReceiptText} delay={550}>
            <Text style={styles.notesText}>{order.notes}</Text>
          </SectionCard>
        )}

        {/* Action Buttons */}
        <View style={styles.footerActions}>
          {canRequestCancel && (
            <TouchableOpacity 
              onPress={() => setShowCancelPopup(true)}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={() => Linking.openURL('tel:919876543210')} // In real app, use support number
            style={styles.supportBtn}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
               <PhoneCall size={18} color="#1a1a1a" />
               <Text style={styles.supportBtnText}>Contact Support</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
  },
  orderDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // Status Hero
  statusHero: {
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: Y,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  orbitBox: {
    height: 180,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  orbitRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  orbitDot: {
    position: 'absolute',
    top: -4,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 4,
  },
  heroIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    zIndex: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  heroStatusTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginTop: 8,
  },
  heroTrackingId: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },

  // Timeline
  timelineContainer: {
    width: '100%',
    paddingVertical: 10,
    position: 'relative',
  },
  timelineLineBg: {
    position: 'absolute',
    top: 24,
    left: 40,
    right: 40,
    height: 2,
    backgroundColor: '#e5e7eb',
  },
  timelineLineActive: {
    position: 'absolute',
    top: 24,
    left: 40,
    height: 2,
    backgroundColor: Y,
  },
  timelineSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  timelineStep: {
    alignItems: 'center',
    width: width / 5, // Approximate for 4 steps
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepDotActive: {
    transform: [{ scale: 1.15 }],
    shadowColor: Y,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  stepLabel: {
    fontSize: 10,
    marginTop: 6,
    textAlign: 'center',
  },

  // Section Cards
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 10,
  },
  sectionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: YL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  sectionContent: {
    padding: 16,
  },

  // Item Rows
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productImgContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 18,
  },
  itemMeta: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  itemMetaText: {
    fontSize: 11,
    color: '#6b7280',
  },
  itemPriceDetail: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },

  // Price Breakdown
  priceBreakdown: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Y,
  },

  // Payment method
  paymentMethodBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 14,
  },
  methodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  methodBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  methodSubtitle: {
    fontSize: 11,
    color: '#6b7280',
  },

  // Address
  addressBox: {
    flexDirection: 'row',
    gap: 12,
  },
  addressIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: YL,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  addressName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  addressPhone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  addressPhoneText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },

  // Track Alert
  trackAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: YL,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Y}44`,
    marginTop: 10,
  },
  trackAlertText: {
    fontSize: 12,
    color: YD,
    fontWeight: '700',
  },

  // Notes
  notesText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // Actions
  footerActions: {
    marginTop: 8,
    gap: 12,
  },
  cancelBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6b7280',
  },
  supportBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: Y,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Y,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  supportBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a1a',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 24,
    paddingTop: 32,
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderBottomWidth: 1,
    borderBottomColor: '#fee2e2',
  },
  modalCloseBtn: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  modalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalRefBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalRefLabel: {
    fontSize: 10,
    color: '#9ca3af',
  },
  modalRefValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  modalActions: {
    padding: 16,
    gap: 12,
  },
  actionBtnWhatsApp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#25D3660A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#25D36644',
  },
  actionBtnCall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: `${Y}0A`,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${Y}44`,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  actionBtnSubtext: {
    fontSize: 11,
    color: '#6b7280',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalFooter: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
  },

  // Skeletons
  statusHeroSkeleton: {
    height: 180,
    backgroundColor: '#fff',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sectionCardSkeleton: {
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 22,
    marginBottom: 16,
  }
});
