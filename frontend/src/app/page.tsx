"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Users, Sparkles, MapPin, Calendar, Heart, MessageSquare, 
  ShoppingBag, Settings, Award, ArrowRight, UserPlus, Globe, 
  Trash2, Plus, ArrowUpRight, Check, Play, Sun, Moon, Volume2, Mic
} from "lucide-react";

// --- Astro Types ---
interface FamilyMember {
  id: string;
  name: string;
  gender: string;
  relationType: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  latitude: number;
  longitude: number;
  tags: string[];
  notes?: string;
  photoUrl?: string;
  userId?: string;
}

interface Astrologer {
  id: string;
  fullName: string;
  bio: string;
  experienceYears: number;
  specialties: string[];
  languages: string[];
  hourlyRate: number;
  rating: number;
  photoUrl: string;
}

interface Appointment {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  type: string;
  status: string;
  meetingUrl: string;
  astrologerName: string;
}

export default function AstroVerseDashboard() {
  // --- States ---
  const [activeTab, setActiveTab] = useState<string>("home");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [language, setLanguage] = useState<string>("en");
  const [rtl, setRtl] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  // Vault Data
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedVaultMember, setSelectedVaultMember] = useState<FamilyMember | null>(null);
  const [vaultMemberKundli, setVaultMemberKundli] = useState<any>(null);
  const [showAddMember, setShowAddMember] = useState<boolean>(false);

  // Form States for Vault / Kundli
  const [newName, setNewName] = useState("");
  const [newGender, setNewGender] = useState("Male");
  const [newRelation, setNewRelation] = useState("Sibling");
  const [newDob, setNewDob] = useState("1995-04-18");
  const [newTob, setNewTob] = useState("12:15");
  const [newPlace, setNewPlace] = useState("Mumbai, India");
  const [newLat, setNewLat] = useState("19.0760");
  const [newLng, setNewLng] = useState("72.8777");
  const [newTags, setNewTags] = useState("Family");
  const [newNotes, setNewNotes] = useState("");

  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    // Inject Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    // Inject Leaflet JS
    if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => {
        setLeafletLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      if ((window as any).L) {
        setLeafletLoaded(true);
      } else {
        const script = document.getElementById("leaflet-js") as HTMLScriptElement;
        if (script) {
          script.onload = () => setLeafletLoaded(true);
        }
      }
    }
  }, []);

  // --- Reusable Location Selector Component with Leaflet Map & Nominatim Autocomplete ---
  const LocationSelector = ({
    place,
    setPlace,
    lat,
    setLat,
    lng,
    setLng,
    idPrefix
  }: {
    place: string;
    setPlace: (v: string) => void;
    lat: string;
    setLat: (v: string) => void;
    lng: string;
    setLng: (v: string) => void;
    idPrefix: string;
  }) => {
    const [searchQuery, setSearchQuery] = useState(place);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [manualEntry, setManualEntry] = useState(false);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerInstanceRef = useRef<any>(null);

    // Sync input field value when external place changes
    useEffect(() => {
      setSearchQuery(place);
    }, [place]);

    // Handle search query autocomplete fetch
    useEffect(() => {
      if (!searchQuery || searchQuery.length < 3) {
        setSuggestions([]);
        return;
      }

      const timer = setTimeout(async () => {
        setLoadingSuggestions(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`);
          const data = await res.json();
          setSuggestions(data);
        } catch (e) {
          console.error("Geocoding fetch failed", e);
        } finally {
          setLoadingSuggestions(false);
        }
      }, 600); // 600ms debounce

      return () => clearTimeout(timer);
    }, [searchQuery]);

    // Initialize/Update Map
    useEffect(() => {
      if (!leafletLoaded || !mapContainerRef.current) return;
      const L = (window as any).L;
      if (!L) return;

      const latitude = parseFloat(lat) || 19.0760;
      const longitude = parseFloat(lng) || 72.8777;

      if (!mapInstanceRef.current) {
        // Create Leaflet Map instance
        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: false
        }).setView([latitude, longitude], 9);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        const marker = L.marker([latitude, longitude], {
          draggable: true
        }).addTo(map);

        // Map Click Handler
        map.on("click", async (e: any) => {
          const { lat: clickLat, lng: clickLng } = e.latlng;
          marker.setLatLng(e.latlng);
          setLat(clickLat.toFixed(6));
          setLng(clickLng.toFixed(6));
          await reverseGeocode(clickLat, clickLng);
        });

        // Marker Drag Handler
        marker.on("dragend", async () => {
          const pos = marker.getLatLng();
          setLat(pos.lat.toFixed(6));
          setLng(pos.lng.toFixed(6));
          await reverseGeocode(pos.lat, pos.lng);
        });

        mapInstanceRef.current = map;
        markerInstanceRef.current = marker;
      } else {
        // Update Marker and View on Coordinate Change
        const map = mapInstanceRef.current;
        const marker = markerInstanceRef.current;
        try {
          const currentLatLng = marker.getLatLng();
          if (currentLatLng.lat !== latitude || currentLatLng.lng !== longitude) {
            marker.setLatLng([latitude, longitude]);
            map.setView([latitude, longitude], map.getZoom());
          }
        } catch (e) {
          console.error("Leaflet map update failed", e);
        }
      }

      // Cleanup function to destroy the map instance when the component unmounts
      return () => {
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove();
          } catch (e) {
            console.error("Leaflet map removal failed", e);
          }
          mapInstanceRef.current = null;
          markerInstanceRef.current = null;
        }
      };
    }, [leafletLoaded, lat, lng]);

    // Reverse geocode handler
    const reverseGeocode = async (latitude: number, longitude: number) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
        const data = await res.json();
        if (data.display_name) {
          const address = data.address || {};
          const shortName = address.city || address.town || address.village || address.suburb || data.display_name.split(",")[0];
          const country = address.country || "";
          const finalPlaceName = country ? `${shortName}, ${country}` : shortName;
          setPlace(finalPlaceName);
          setSearchQuery(finalPlaceName);
        }
      } catch (e) {
        console.error("Reverse geocoding failed", e);
      }
    };

    // Select Autocomplete Suggestion
    const handleSelectSuggestion = (item: any) => {
      const address = item.address || {};
      const shortName = address.city || address.town || address.village || address.suburb || item.display_name.split(",")[0];
      const country = address.country || "";
      const finalPlaceName = country ? `${shortName}, ${country}` : shortName;
      
      setPlace(finalPlaceName);
      setSearchQuery(finalPlaceName);
      setLat(parseFloat(item.lat).toFixed(6));
      setLng(parseFloat(item.lon).toFixed(6));
      setSuggestions([]);
    };

    return (
      <div className="space-y-3">
        {/* Place Autocomplete Search Input */}
        <div className="relative space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Search Birth Location</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Start typing city/country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 pl-9 text-sm outline-none text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50"
            />
            <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            {loadingSuggestions && (
              <div className="absolute right-3 top-3.5 h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            )}
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute z-50 w-full bg-[#1b1b32] border border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto mt-1 divide-y divide-white/5">
              {suggestions.map((item, index) => (
                <div
                  key={`${idPrefix}-sugg-${index}`}
                  onClick={() => handleSelectSuggestion(item)}
                  className="p-3 text-xs text-muted-foreground hover:bg-white/5 hover:text-foreground cursor-pointer transition text-left"
                >
                  {item.display_name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map View Section */}
        {leafletLoaded ? (
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground flex justify-between">
              <span>Select Pin on Interactive Map</span>
              <span className="text-primary italic">Drag marker or click map to adjust</span>
            </label>
            <div
              ref={mapContainerRef}
              className="w-full h-[180px] rounded-lg border border-white/10 bg-black/20"
              style={{ zIndex: 1 }}
            />
          </div>
        ) : (
          <div className="w-full h-[180px] rounded-lg border border-white/10 bg-white/5 animate-pulse flex items-center justify-center text-xs text-muted-foreground">
            Loading Map Engine...
          </div>
        )}

        {/* Toggle Manual Coordinates Entry */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setManualEntry(!manualEntry)}
            className="text-[10px] text-primary hover:underline font-semibold"
          >
            {manualEntry ? "Hide Precise Coordinates" : "Show Precise Coordinates (Latitude / Longitude)"}
          </button>
        </div>

        {/* Manual Latitude & Longitude Inputs */}
        {manualEntry && (
          <div className="grid grid-cols-2 gap-3 animate-fadeIn">
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-semibold text-muted-foreground">Latitude (°N)</label>
              <input
                type="number"
                step="0.000001"
                required
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs outline-none text-foreground focus:border-primary/50"
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-semibold text-muted-foreground">Longitude (°E)</label>
              <input
                type="number"
                step="0.000001"
                required
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs outline-none text-foreground focus:border-primary/50"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Astrology Chart States
  const [selectedChartStyle, setSelectedChartStyle] = useState<"north" | "south" | "east">("north");
  const [kundliReport, setKundliReport] = useState<any>(null);

  // Matchmaking States
  const [matchPrimary, setMatchPrimary] = useState<string>("");
  const [matchSecondary, setMatchSecondary] = useState<string>("");
  const [matchmakingResult, setMatchmakingResult] = useState<any>(null);

  // Muhurat States
  const [muhuratEvent, setMuhuratEvent] = useState<string>("Marriage");
  const [muhuratStart, setMuhuratStart] = useState<string>("2026-07-01");
  const [muhuratEnd, setMuhuratEnd] = useState<string>("2026-07-31");
  const [muhuratReport, setMuhuratReport] = useState<any[]>([]);

  // Baby Planning & Naming States
  const [babyDob, setBabyDob] = useState<string>("2026-06-15");
  const [babyGender, setBabyGender] = useState<string>("Male");
  const [babyNamesCategory, setBabyNamesCategory] = useState<string>("Sanskrit");
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);
  const [babyPlanResult, setBabyPlanResult] = useState<any>(null);

  // AI Assistant States
  const [aiMessage, setAiMessage] = useState<string>("");
  const [aiConversation, setAiConversation] = useState<Array<{ sender: "user" | "ai"; text: string; context?: string }>>([
    { sender: "ai", text: "Greetings! I am your AstroVerse AI Assistant. Choose a member from the Vault to analyze their configurations, or ask me any question directly." }
  ]);
  const [aiSelectedMember, setAiSelectedMember] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Marketplace States
  const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
  const [selectedAstrologer, setSelectedAstrologer] = useState<Astrologer | null>(null);
  const [bookingDate, setBookingDate] = useState<string>("2026-06-20");
  const [bookingTime, setBookingTime] = useState<string>("15:00");
  const [bookingNotes, setBookingNotes] = useState<string>("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Subscription Status
  const [subscription, setSubscription] = useState<any>({
    planType: "Free",
    endDate: "2126-06-14T07:55:00Z",
    limits: { maxFamilyMembers: 3, hasAiAssistant: false }
  });
  const [showBillingModal, setShowBillingModal] = useState<boolean>(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<string>("Premium");

  // Translations console
  const [translationsList, setTranslationsList] = useState<any[]>([]);
  const [newTransKey, setNewTransKey] = useState("");
  const [newTransValEn, setNewTransValEn] = useState("");
  const [newTransValHi, setNewTransValHi] = useState("");
  const [newTransValAr, setNewTransValAr] = useState("");

  // System Stats
  const [metrics, setMetrics] = useState<any>({
    totalUsers: 3,
    totalAstrologers: 1,
    totalFamilyProfiles: 2,
    activeAppointments: 1,
    totalRevenue: 0.00
  });

  // Base URL config
  const API_BASE = "http://localhost:5000/api";

  // --- Static Fallback Translations Dictionary ---
  const localTranslations: Record<string, Record<string, string>> = {
    en: {
      home_title: "Discover Your Cosmic Blueprint",
      home_subtitle: "Connect with stars, plan life events, and chat with AI astrologers.",
      nav_vault: "Family Astro Vault",
      nav_marketplace: "Consultation Marketplace",
      nav_ai_assistant: "AI Assistant",
      nav_horoscope: "Daily Horoscope",
      nav_compatibility: "Kundli Matchmaking",
      nav_muhurat: "Muhurat Planner",
      nav_admin: "Admin Console",
      nav_upgrade: "Upgrade Plans",
      btn_generate: "Generate Chart",
      btn_book: "Book Consultation",
      btn_add_member: "Add Vault Profile"
    },
    hi: {
      home_title: "अपने ब्रह्मांडीय खाके की खोज करें",
      home_subtitle: "सितारों से जुड़ें, जीवन की घटनाओं की योजना बनाएं, और एआई ज्योतिषियों से चैट करें।",
      nav_vault: "एस्ट्रो वॉल्ट",
      nav_marketplace: "परामर्श बाज़ार",
      nav_ai_assistant: "एआई सहायक",
      nav_horoscope: "राशिफल",
      nav_compatibility: "कुंडली मिलान",
      nav_muhurat: "शुभ मुहूर्त नियोजक",
      nav_admin: "प्रशासक पोर्टल",
      nav_upgrade: "योजनाएं अपग्रेड करें",
      btn_generate: "कुंडली बनाएं",
      btn_book: "परामर्श बुक करें",
      btn_add_member: "प्रोफ़ाइल जोड़ें"
    },
    ar: {
      home_title: "اكتشف مخططك الكوني",
      home_subtitle: "تواصل مع النجوم، وخطط لأحداث الحياة، ودردش مع منجمي الذكاء الاصطناعي.",
      nav_vault: "قبو الفلك",
      nav_marketplace: "سوق الاستشارات",
      nav_ai_assistant: "مساعد الذكاء الاصطناعي",
      nav_horoscope: "الأبراج اليومية",
      nav_compatibility: "التوافق والاقتران",
      nav_muhurat: "مخطط الأوقات السعيدة",
      nav_admin: "لوحة التحكم",
      nav_upgrade: "ترقية الخطط",
      btn_generate: "توليد الخريطة",
      btn_book: "حجز استشارة",
      btn_add_member: "إضافة ملف شخصي"
    }
  };

  const getT = (key: string) => {
    if (localTranslations[language] && localTranslations[language][key]) {
      return localTranslations[language][key];
    }
    return localTranslations["en"][key] || key;
  };

  // --- Dynamic RTL switcher ---
  useEffect(() => {
    if (language === "ar" || language === "ur") {
      setRtl(true);
    } else {
      setRtl(false);
    }
  }, [language]);

  // --- API Fetch Functions ---
  const loadVaultMembers = async () => {
    try {
      const res = await fetch(`${API_BASE}/vault`);
      const data = await res.json();
      if (data.success) {
        setFamilyMembers(data.data);
      }
    } catch {
      // Mock Fallback
      setFamilyMembers([
        {
          id: "m1",
          name: "Regular User",
          gender: "Male",
          relationType: "Self",
          dateOfBirth: "1993-10-24",
          timeOfBirth: "08:30:00",
          placeOfBirth: "Delhi, India",
          latitude: 28.6139,
          longitude: 77.2090,
          tags: ["Self"]
        },
        {
          id: "m2",
          name: "Priya Sen",
          gender: "Female",
          relationType: "Spouse",
          dateOfBirth: "1995-04-18",
          timeOfBirth: "12:15:00",
          placeOfBirth: "Mumbai, India",
          latitude: 19.0760,
          longitude: 72.8777,
          tags: ["Spouse", "Family"]
        }
      ]);
    }
  };

  const loadAstrologers = async () => {
    try {
      const res = await fetch(`${API_BASE}/marketplace/astrologers`);
      const data = await res.json();
      if (data.success) {
        setAstrologers(data.data);
      }
    } catch {
      setAstrologers([
        {
          id: "a1",
          fullName: "Acharya Sharma",
          bio: "Professional Vedic astrologer with over 15 years of experience in planetary alignments and gemstone remedies.",
          experienceYears: 15,
          specialties: ["Vedic", "Kundli Matching", "Muhurat"],
          languages: ["English", "Hindi", "Sanskrit"],
          hourlyRate: 75.00,
          rating: 4.9,
          photoUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Acharya"
        }
      ]);
    }
  };

  const loadAppointments = async () => {
    try {
      const res = await fetch(`${API_BASE}/marketplace/appointments`);
      const data = await res.json();
      if (data.success) {
        setAppointments(data.data);
      }
    } catch {
      setAppointments([
        {
          id: "ap1",
          scheduledAt: "2026-06-20T15:00:00Z",
          durationMinutes: 30,
          type: "Video",
          status: "Scheduled",
          meetingUrl: "https://meet.jit.si/astroverse-7fd21a",
          astrologerName: "Acharya Sharma"
        }
      ]);
    }
  };

  const loadSubscriptionStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/subscription/status`);
      const data = await res.json();
      if (data.success) {
        setSubscription(data.data);
      }
    } catch {
      // Keep default free plan
    }
  };

  const loadMetrics = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/metrics`);
      const data = await res.json();
      if (data.success) {
        setMetrics(data.data);
      }
    } catch {
      // Keep mock metrics
    }
  };

  const loadTranslations = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/translations`);
      const data = await res.json();
      if (data.success) {
        setTranslationsList(data.data);
      }
    } catch {
      setTranslationsList([
        { id: "1", languageCode: "en", key: "home_title", value: "Discover Your Cosmic Blueprint" },
        { id: "2", languageCode: "hi", key: "home_title", value: "अपने ब्रह्मांडीय खाके की खोज करें" },
        { id: "3", languageCode: "ar", key: "home_title", value: "اكتشف مخططك الكوني" }
      ]);
    }
  };

  // --- Auth Screen States & Handlers ---
  const [authMode, setAuthMode] = useState<"login" | "register" | "otp">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authOtp, setAuthOtp] = useState("");
  const [showOtpField, setShowOtpField] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === "login") {
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: authEmail, password: authPassword })
        });
        const data = await res.json();
        if (data.success) {
          setAuthToken(data.token);
          alert(`Welcome back, ${data.user.fullName}!`);
        } else {
          alert(data.message || "Invalid credentials.");
        }
      } catch {
        // Local simulation fallback
        if ((authEmail === "user@astroverse.com" && authPassword === "User@123") || 
            (authEmail === "admin@astroverse.com" && authPassword === "Admin@123") || 
            authPassword.length >= 6) {
          setAuthToken("mock_jwt_token");
          alert("Welcome to AstroVerse (Local Demo Session)!");
        } else {
          alert("Please check your email/password. For local offline demo, use: user@astroverse.com / User@123");
        }
      }
    } else if (authMode === "register") {
      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: authEmail, password: authPassword, fullName: authName })
        });
        const data = await res.json();
        if (data.success) {
          setAuthToken(data.token);
          alert("Registration successful! Initial vault profile created.");
          loadVaultMembers();
        } else {
          alert(data.message || "Registration failed.");
        }
      } catch {
        setAuthToken("mock_jwt_token");
        alert("Registration simulated locally!");
      }
    } else { // OTP mode
      if (!showOtpField) {
        setShowOtpField(true);
        alert("OTP code 1234 sent to your email (Simulated).");
      } else {
        if (authOtp === "1234") {
          setAuthToken("mock_jwt_token");
          alert("OTP authentication successful!");
        } else {
          alert("Invalid OTP code. Use 1234 for simulation.");
        }
      }
    }
  };

  const handleSocialLogin = (provider: string) => {
    setAuthToken("mock_social_token");
    alert(`Connected successfully via ${provider} OAuth!`);
  };

  // Run initial loading
  useEffect(() => {
    loadVaultMembers();
    loadAstrologers();
    loadAppointments();
    loadSubscriptionStatus();
    loadMetrics();
    loadTranslations();
  }, []);

  // --- Form Actions ---
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Plan Limits checks
    if (subscription.planType === "Free" && familyMembers.length >= subscription.limits.maxFamilyMembers) {
      alert("Upgrade to Premium for unlimited family profiles!");
      setActiveTab("upgrade");
      return;
    }

    const payload = {
      name: newName,
      gender: newGender,
      relationType: newRelation,
      dateOfBirth: newDob,
      timeOfBirth: `${newTob}:00`,
      latitude: parseFloat(newLat),
      longitude: parseFloat(newLng),
      placeOfBirth: newPlace,
      tags: newTags.split(",").map(t => t.trim()),
      notes: newNotes
    };

    try {
      const res = await fetch(`${API_BASE}/vault`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        loadVaultMembers();
        setShowAddMember(false);
        // Clear fields
        setNewName("");
      }
    } catch {
      // Local addition
      const mockId = `mock_${Date.now()}`;
      const newMember: FamilyMember = {
        id: mockId,
        ...payload,
        timeOfBirth: `${newTob}:00`
      };
      setFamilyMembers(prev => [...prev, newMember]);
      setShowAddMember(false);
      setNewName("");
    }
  };

  const deleteMember = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/vault/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        loadVaultMembers();
        if (selectedVaultMember?.id === id) {
          setSelectedVaultMember(null);
          setVaultMemberKundli(null);
        }
      }
    } catch {
      setFamilyMembers(prev => prev.filter(m => m.id !== id));
      if (selectedVaultMember?.id === id) {
        setSelectedVaultMember(null);
        setVaultMemberKundli(null);
      }
    }
  };

  const normalizeKundli = (k: any): any => {
    if (!k) return null;
    return {
      Rashi: k.rashi !== undefined ? k.rashi : k.Rashi,
      Nakshatra: k.nakshatra !== undefined ? k.nakshatra : k.Nakshatra,
      Ascendant: k.ascendant !== undefined ? k.ascendant : k.Ascendant,
      LagnaChartData: k.lagnaChartData !== undefined ? k.lagnaChartData : k.LagnaChartData,
      NavamsaChartData: k.navamsaChartData !== undefined ? k.navamsaChartData : k.NavamsaChartData,
      PlanetaryPositions: k.planetaryPositions !== undefined ? k.planetaryPositions : k.PlanetaryPositions,
      DashaAnalysis: k.dashaAnalysis !== undefined ? k.dashaAnalysis : k.DashaAnalysis,
      Yogas: k.yogas !== undefined ? k.yogas : k.Yogas,
      Doshas: k.doshas !== undefined ? k.doshas : k.Doshas,
      Panchang: k.panchang !== undefined ? k.panchang : k.Panchang,
      Predictions: k.predictions !== undefined ? k.predictions : k.Predictions,
    };
  };

  const normalizeMatchmaking = (m: any): any => {
    if (!m) return null;
    return {
      GunaMilanScore: m.gunaMilanScore !== undefined ? m.gunaMilanScore : m.GunaMilanScore,
      CompatibilityScore: m.compatibilityScore !== undefined ? m.compatibilityScore : m.CompatibilityScore,
      ManglikStatus: m.manglikStatus !== undefined ? m.manglikStatus : m.ManglikStatus,
      DoshaAnalysis: m.doshaAnalysis !== undefined ? m.doshaAnalysis : m.DoshaAnalysis,
      Recommendations: m.recommendations !== undefined ? m.recommendations : m.Recommendations,
    };
  };

  const handlePrintPdf = (k: any, pName: string, pGender: string, pDob: string, pTob: string, pPlace: string) => {
    if (!k) return;
    const panchang = k.Panchang ? (typeof k.Panchang === "string" ? JSON.parse(k.Panchang) : k.Panchang) : null;
    const predictions = k.Predictions ? (typeof k.Predictions === "string" ? JSON.parse(k.Predictions) : k.Predictions) : null;
    const planetaryPositions = k.PlanetaryPositions ? (typeof k.PlanetaryPositions === "string" ? JSON.parse(k.PlanetaryPositions) : k.PlanetaryPositions) : [];
    const dasha = k.DashaAnalysis ? (typeof k.DashaAnalysis === "string" ? JSON.parse(k.DashaAnalysis) : k.DashaAnalysis) : [];

    let chartData: Record<string, string[]> = {};
    try { chartData = JSON.parse(k.LagnaChartData); } catch {}
    
    const getPlanetsString = (houseKey: string) => {
      return chartData[houseKey]?.join(", ") || "";
    };

    const northSvg = `
      <svg viewBox="0 0 200 200" style="width:230px; height:230px; border:1px solid #b38b40; background:#faf7f0;">
        <rect x="10" y="10" width="180" height="180" stroke="#8c6212" stroke-width="1.5" fill="none" />
        <line x1="10" y1="10" x2="190" y2="190" stroke="#8c6212" stroke-width="1.5" />
        <line x1="190" y1="10" x2="10" y2="190" stroke="#8c6212" stroke-width="1.5" />
        <line x1="100" y1="10" x2="10" y2="100" stroke="#8c6212" stroke-width="1.5" />
        <line x1="10" y1="100" x2="100" y2="190" stroke="#8c6212" stroke-width="1.5" />
        <line x1="100" y1="190" x2="190" y2="100" stroke="#8c6212" stroke-width="1.5" />
        <line x1="190" y1="100" x2="100" y2="1" stroke="#8c6212" stroke-width="1.5" />
        <text x="100" y="45" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="#b38b40">${getPlanetsString("house1")}</text>
        <text x="100" y="55" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#8c6212">1 (Lagna)</text>
        <text x="50" y="25" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="#b38b40">${getPlanetsString("house2")}</text>
        <text x="50" y="35" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#8c6212">2</text>
        <text x="25" y="50" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="#b38b40">${getPlanetsString("house3")}</text>
        <text x="25" y="60" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#8c6212">3</text>
        <text x="50" y="100" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="#b38b40">${getPlanetsString("house4")}</text>
        <text x="50" y="110" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#8c6212">4</text>
        <text x="25" y="140" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="#b38b40">${getPlanetsString("house5")}</text>
        <text x="25" y="150" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#8c6212">5</text>
        <text x="50" y="170" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="#b38b40">${getPlanetsString("house6")}</text>
        <text x="50" y="180" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#8c6212">6</text>
        <text x="100" y="145" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="#b38b40">${getPlanetsString("house7")}</text>
        <text x="100" y="155" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#8c6212">7</text>
        <text x="150" y="170" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="#b38b40">${getPlanetsString("house8")}</text>
        <text x="150" y="180" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#8c6212">8</text>
        <text x="175" y="140" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="#b38b40">${getPlanetsString("house9")}</text>
        <text x="175" y="150" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#8c6212">9</text>
        <text x="150" y="100" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="#b38b40">${getPlanetsString("house10")}</text>
        <text x="150" y="110" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#8c6212">10</text>
        <text x="175" y="50" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="#b38b40">${getPlanetsString("house11")}</text>
        <text x="175" y="60" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#8c6212">11</text>
        <text x="150" y="25" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="#b38b40">${getPlanetsString("house12")}</text>
        <text x="150" y="35" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#8c6212">12</text>
      </svg>
    `;

    const cells = [
      { id: "12", x: 0, y: 0 }, { id: "1", x: 50, y: 0 }, { id: "2", x: 100, y: 0 }, { id: "3", x: 150, y: 0 },
      { id: "11", x: 0, y: 50 },                                                     { id: "4", x: 150, y: 50 },
      { id: "10", x: 0, y: 100 },                                                    { id: "5", x: 150, y: 100 },
      { id: "9", x: 0, y: 150 },  { id: "8", x: 50, y: 150 }, { id: "7", x: 100, y: 150 }, { id: "6", x: 150, y: 150 }
    ];
    const southSvg = `
      <svg viewBox="0 0 200 200" style="width:230px; height:230px; border:1px solid #b38b40; background:#faf7f0;">
        <rect x="0" y="0" width="200" height="200" stroke="#8c6212" stroke-width="1.5" fill="none" />
        <line x1="50" y1="0" x2="50" y2="200" stroke="#8c6212" stroke-width="1.5" />
        <line x1="100" y1="0" x2="100" y2="200" stroke="#8c6212" stroke-width="1.5" />
        <line x1="150" y1="0" x2="150" y2="200" stroke="#8c6212" stroke-width="1.5" />
        <line x1="0" y1="50" x2="200" y2="50" stroke="#8c6212" stroke-width="1.5" />
        <line x1="0" y1="100" x2="200" y2="100" stroke="#8c6212" stroke-width="1.5" />
        <line x1="0" y1="150" x2="200" y2="150" stroke="#8c6212" stroke-width="1.5" />
        ${cells.map(c => `
          <g>
            <text x="${c.x + 25}" y="${c.y + 40}" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#8c6212">${c.id}</text>
            <text x="${c.x + 25}" y="${c.y + 25}" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="#b38b40">${chartData["house" + c.id]?.join(", ") || ""}</text>
          </g>
        `).join("")}
      </svg>
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>AstroVerse - Janam Patrika (${pName})</title>
          <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Outfit', sans-serif;
              color: #1a1a2e;
              background-color: #ffffff;
              margin: 0;
              padding: 20px;
              line-height: 1.5;
            }
            .patrika-container {
              max-width: 800px;
              margin: 0 auto;
              border: 4px double #b38b40;
              padding: 35px;
              border-radius: 12px;
              background: #fffdf9;
              box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #b38b40;
              padding-bottom: 15px;
              margin-bottom: 25px;
            }
            .header-symbol {
              font-family: 'Cinzel', serif;
              font-size: 14px;
              color: #8c6212;
              letter-spacing: 4px;
              font-weight: 800;
              margin-bottom: 5px;
            }
            .title {
              font-family: 'Cinzel', serif;
              font-size: 30px;
              font-weight: 800;
              color: #8c6212;
              margin: 0;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .subtitle {
              font-size: 13px;
              color: #666;
              margin-top: 5px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .section-title {
              font-family: 'Cinzel', serif;
              font-size: 18px;
              color: #8c6212;
              border-bottom: 2px solid #e2d1b0;
              padding-bottom: 5px;
              margin-top: 35px;
              margin-bottom: 15px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .data-table th, .data-table td {
              border: 1px solid #e2d1b0;
              padding: 9px 12px;
              text-align: left;
              font-size: 12px;
            }
            .data-table th {
              background-color: #f7f3e9;
              color: #8c6212;
              font-weight: 700;
              text-transform: uppercase;
              font-size: 11px;
            }
            .data-table td {
              color: #333;
            }
            .prediction-card {
              background: #faf7f0;
              border-left: 4px solid #b38b40;
              padding: 15px;
              margin-bottom: 15px;
              border-radius: 6px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.02);
            }
            .prediction-title {
              font-weight: 700;
              color: #8c6212;
              font-size: 14px;
              margin-bottom: 6px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .prediction-text {
              font-size: 13px;
              line-height: 1.6;
              color: #222;
            }
            .charts-row {
              display: flex;
              justify-content: space-around;
              align-items: center;
              margin: 25px 0;
              gap: 20px;
            }
            .chart-container {
              text-align: center;
            }
            .chart-label {
              font-family: 'Cinzel', serif;
              font-size: 12px;
              color: #8c6212;
              font-weight: 700;
              margin-top: 8px;
              text-transform: uppercase;
            }
            .meta-info {
              background-color: #faf7f0;
              border: 1px solid #e2d1b0;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 25px;
              font-size: 12px;
            }
            .meta-info table {
              width: 100%;
            }
            .meta-info td {
              padding: 4px 10px;
            }
            .meta-info td.label {
              font-weight: 700;
              color: #8c6212;
              width: 15%;
            }
            .page-break {
              page-break-before: always;
            }
            @media print {
              body {
                padding: 0;
              }
              .patrika-container {
                border: none;
                padding: 0;
                background: none;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="patrika-container">
            <div class="header">
              <div class="header-symbol">|| श्री गणेशाय नमः ||</div>
              <h1 class="title">जन्म पत्रिका (Janam Patrika)</h1>
              <div class="subtitle">Personalized Vedic Astrological Document</div>
            </div>

            <div class="meta-info">
              <table>
                <tr>
                  <td class="label">Name:</td>
                  <td>${pName}</td>
                  <td class="label">Birth Date:</td>
                  <td>${pDob}</td>
                </tr>
                <tr>
                  <td class="label">Gender:</td>
                  <td>${pGender}</td>
                  <td class="label">Birth Time:</td>
                  <td>${pTob}</td>
                </tr>
                <tr>
                  <td class="label">Place:</td>
                  <td>${pPlace}</td>
                  <td class="label">Ascendant:</td>
                  <td>${k.Ascendant} (${panchang?.AscendantLord || ""})</td>
                </tr>
                <tr>
                  <td class="label">Moon Sign:</td>
                  <td>${k.Rashi} (${panchang?.MoonSignLord || ""})</td>
                  <td class="label">Nakshatra:</td>
                  <td>${k.Nakshatra} (Pada ${panchang?.Charan || "1"})</td>
                </tr>
              </table>
            </div>

            <div class="section-title">I. Vedic Panchang Details</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Panchang Parameter</th>
                  <th>Value</th>
                  <th>Description / Signified Meanings</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Tithi (Vedic Day)</td>
                  <td><strong>${panchang?.Tithi || "Pratipada"}</strong></td>
                  <td>Lunar phase representing psychological state and emotional energy</td>
                </tr>
                <tr>
                  <td>Vedic Day</td>
                  <td><strong>${panchang?.VedicDay || "Monday"}</strong></td>
                  <td>Solar day ruler signifying physical energy, health, and general temperament</td>
                </tr>
                <tr>
                  <td>Yoga</td>
                  <td><strong>${panchang?.Yoga || "Vishkumbha"}</strong></td>
                  <td>The angular relationship between Sun and Moon representing health qualities</td>
                </tr>
                <tr>
                  <td>Karana</td>
                  <td><strong>${panchang?.Karana || "Bava"}</strong></td>
                  <td>Half of a Tithi, indicating professional capabilities and actions</td>
                </tr>
                <tr>
                  <td>Ayanamsha</td>
                  <td><strong>${panchang?.Ayanamsha || ""}</strong></td>
                  <td>Lahiri value indicating precision correction for planetary longitude</td>
                </tr>
                <tr>
                  <td>Sunrise / Sunset</td>
                  <td><strong>${panchang?.Sunrise || "05:48 AM"} / ${panchang?.Sunset || "06:42 PM"}</strong></td>
                  <td>Vedic diurnal transitions marking sandhya hours for prayers</td>
                </tr>
              </tbody>
            </table>

            <div class="section-title">II. Avakahada Chakra (Vedic Attributes)</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Vargas Attribute</th>
                  <th>Value</th>
                  <th>Signified Meanings in Life</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Varna</td>
                  <td><strong>${panchang?.Varna || "Brahmana"}</strong></td>
                  <td>Represents spiritual, mental, and professional inclination category</td>
                </tr>
                <tr>
                  <td>Vashya</td>
                  <td><strong>${panchang?.Vashya || "Nara"}</strong></td>
                  <td>Indicates relationship compatibility dominance and social magnetism</td>
                </tr>
                <tr>
                  <td>Yoni</td>
                  <td><strong>${panchang?.Yoni || "Ashwa"}</strong></td>
                  <td>Animal representation signifying basic biological nature, temperament, and health</td>
                </tr>
                <tr>
                  <td>Gana</td>
                  <td><strong>${panchang?.Gana || "Deva"}</strong></td>
                  <td>Categories indicating compatibility values (Divine, Human, or Demonic characteristics)</td>
                </tr>
                <tr>
                  <td>Nadi</td>
                  <td><strong>${panchang?.Nadi || "Madhya"}</strong></td>
                  <td>Ayurvedic humors (Vata, Pitta, Kapha) representing nervous and health resonance</td>
                </tr>
              </tbody>
            </table>

            <div class="page-break"></div>

            <div class="section-title">III. Astrological Kundli Charts</div>
            <div class="charts-row">
              <div class="chart-container">
                ${northSvg}
                <div class="chart-label">Lagna Kundli (D-1 Chart)</div>
              </div>
              <div class="chart-container">
                ${southSvg}
                <div class="chart-label">Navamsa Kundli (D-9 Chart)</div>
              </div>
            </div>

            <div class="section-title">IV. Planetary Positions & Coordinates</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Planet</th>
                  <th>Rashi Placement</th>
                  <th>Degree / Coordinates</th>
                  <th>Retrograde</th>
                  <th>House</th>
                </tr>
              </thead>
              <tbody>
                ${planetaryPositions.map((p: any) => `
                  <tr>
                    <td><strong>${p.planet}</strong></td>
                    <td>${p.rashi || k.Rashi}</td>
                    <td>${p.degree}</td>
                    <td>${p.isRetrograde ? "Yes (R)" : "No"}</td>
                    <td>House ${p.house}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <div class="page-break"></div>

            <div class="section-title">V. Vimshottari Mahadasha Timelines</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Mahadasha Planet</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Duration (Years)</th>
                </tr>
              </thead>
              <tbody>
                ${dasha.map((d: any) => `
                  <tr>
                    <td><strong>${d.mahadasha}</strong></td>
                    <td>${d.start}</td>
                    <td>${d.end}</td>
                    <td>${d.mahadasha === "Ketu" ? 7 : d.mahadasha === "Venus" ? 20 : d.mahadasha === "Sun" ? 6 : d.mahadasha === "Moon" ? 10 : d.mahadasha === "Mars" ? 7 : d.mahadasha === "Rahu" ? 18 : d.mahadasha === "Jupiter" ? 16 : d.mahadasha === "Saturn" ? 19 : 17} Years</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <div class="section-title">VI. Detailed Astrological Predictions</div>
            
            <div class="prediction-card">
              <div class="prediction-title">Personality & General Nature</div>
              <div class="prediction-text">${predictions?.Nature || "Intuitive, analytical, and honest. Possesses strong intelligence and deep creative capacity."}</div>
            </div>

            <div class="prediction-card">
              <div class="prediction-title">Education & Academic Career</div>
              <div class="prediction-text">${predictions?.Education || "Favorable intellectual growth. Strong aptitude for research-oriented fields, learning capacity, and logical deduction."}</div>
            </div>

            <div class="prediction-card">
              <div class="prediction-title">Health & Physical Vitality</div>
              <div class="prediction-text">${predictions?.Health || "Generally stable immunity. Needs focus on stress-relief, balanced meals, and regular hydration cycles."}</div>
            </div>

            <div class="prediction-card">
              <div class="prediction-title">Living Style & Habitat</div>
              <div class="prediction-text">${predictions?.LivingStyle || "Values structure, clean aesthetic environment, and comfortable living areas. Prefers peaceful spaces."}</div>
            </div>

            <div class="prediction-card">
              <div class="prediction-title">Money & Financial Accumulation</div>
              <div class="prediction-text">${predictions?.Money || "Steady accumulation of assets through structural investment. Wealth graph rises significantly after age 28-30."}</div>
            </div>

            <div class="prediction-card">
              <div class="prediction-title">Age, Longevity & Lifecycle</div>
              <div class="prediction-text">${predictions?.Age || "Promising longevity (Dirghayu) with strong vitality. Life chapters shift significantly at ages 32 and 48."}</div>
            </div>

            <div class="prediction-card">
              <div class="prediction-title">Major Life Events & Milestones</div>
              <div class="prediction-text">${predictions?.BigEvents || "Career breakthrough at age 27. Auspicious marriage window between 2028 and 2030. Relocation opportunities in 2033."}</div>
            </div>
            
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSelectVaultMember = async (member: FamilyMember) => {
    setSelectedVaultMember(member);
    try {
      const res = await fetch(`${API_BASE}/vault/${member.id}/kundli`);
      const data = await res.json();
      if (data.success) {
        setVaultMemberKundli(normalizeKundli(data.data));
      }
    } catch {
      // Local generation fallback
      const timeOfBirth = TimeSpanParse(member.timeOfBirth);
      const generated = mockGenerateKundli(member.name, member.gender, new Date(member.dateOfBirth), timeOfBirth, member.latitude, member.longitude, member.placeOfBirth);
      setVaultMemberKundli(generated);
    }
  };

  const handleCreateKundli = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: newName || "Self",
      gender: newGender,
      dateOfBirth: newDob,
      timeOfBirth: `${newTob}:00`,
      latitude: parseFloat(newLat),
      longitude: parseFloat(newLng),
      placeOfBirth: newPlace
    };

    try {
      const res = await fetch(`${API_BASE}/astrology/kundli`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setKundliReport(normalizeKundli(data.data));
      }
    } catch {
      // Fallback
      setKundliReport(mockGenerateKundli(payload.name, payload.gender, new Date(payload.dateOfBirth), TimeSpanParse(payload.timeOfBirth), payload.latitude, payload.longitude, payload.placeOfBirth));
    }
  };

  const handleRunMatchmaking = async () => {
    const pMember = familyMembers.find(m => m.id === matchPrimary);
    const sMember = familyMembers.find(m => m.id === matchSecondary);
    if (!pMember || !sMember) {
      alert("Please select primary and secondary profiles from the vault.");
      return;
    }

    const payload = {
      primaryName: pMember.name,
      primaryDateOfBirth: pMember.dateOfBirth,
      primaryTimeOfBirth: pMember.timeOfBirth,
      secondaryName: sMember.name,
      secondaryDateOfBirth: sMember.dateOfBirth,
      secondaryTimeOfBirth: sMember.timeOfBirth
    };

    try {
      const res = await fetch(`${API_BASE}/astrology/matchmaking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setMatchmakingResult(normalizeMatchmaking(data.data));
      }
    } catch {
      // Local compatibility checker
      const score = mockCompatibilityScore(pMember, sMember);
      setMatchmakingResult(score);
    }
  };


  const handleGenerateBabyNames = async () => {
    const member = familyMembers.find(m => m.relationType === "Self") || familyMembers[0];
    const payload = {
      dateOfBirth: babyDob,
      timeOfBirth: "08:30:00",
      latitude: member ? member.latitude : 28.6139,
      longitude: member ? member.longitude : 77.2090,
      gender: babyGender,
      category: babyNamesCategory
    };

    try {
      const res = await fetch(`${API_BASE}/astrology/baby-names`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedNames(data.names);
      }
    } catch {
      // Local fallback
      setGeneratedNames(babyGender === "Male" 
        ? ["Aarav", "Amit", "Alok", "Anuj"] 
        : ["Aditi", "Mira", "Maya", "Amita"]);
    }

    try {
      const res = await fetch(`${API_BASE}/astrology/plan-baby`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedDate: babyDob, gender: babyGender })
      });
      const data = await res.json();
      if (data.success) {
        setBabyPlanResult(data.data);
      }
    } catch {
      setBabyPlanResult({
        expectedRashi: "Taurus",
        expectedNakshatra: "Rohini",
        suggestedStartingLetters: ["V", "O", "A"],
        numerologyAnalysis: "Life Path Number reduces to 6 - represents Venusian charm, aesthetic and creative growth.",
        astrologyAnalysis: "High alignment with Jupiter ensures support and protective environment for planning."
      });
    }
  };

  const handlePlanMuhurat = async () => {
    const member = familyMembers.find(m => m.relationType === "Self") || familyMembers[0];
    if (!member) return;

    const payload = {
      familyMemberId: member.id,
      eventType: muhuratEvent,
      startDate: muhuratStart,
      endDate: muhuratEnd
    };

    try {
      const res = await fetch(`${API_BASE}/astrology/plan-muhurat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setMuhuratReport(data.data);
      }
    } catch {
      setMuhuratReport([
        { date: "2026-07-07", timeSlot: "08:15 AM - 10:30 AM", score: 94, muhuratName: "Abhijit Muhurat", explanation: "Excellent planetary configuration. Lagna lord is conjoined in favorable houses." },
        { date: "2026-07-15", timeSlot: "11:45 AM - 01:30 PM", score: 88, muhuratName: "Shubha Choghadiya", explanation: "Favorable moon placement offers growth and long term support." }
      ]);
    }
  };

  const handleAiChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMessage.trim()) return;

    const userMsg = aiMessage;
    setAiConversation(prev => [...prev, { sender: "user", text: userMsg }]);
    setAiMessage("");

    const payload = {
      userId: familyMembers[0]?.userId || "00000000-0000-0000-0000-000000000000",
      message: userMsg,
      activeMemberId: aiSelectedMember || null,
      languageCode: language
    };

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setAiConversation(prev => [...prev, { 
          sender: "ai", 
          text: data.data.reply, 
          context: data.data.contextUsed?.join(", ") 
        }]);
      }
    } catch {
      // Local mock response
      setTimeout(() => {
        let reply = "I've reviewed your configurations. Jupiter transits your moon sign indicating growth.";
        if (userMsg.toLowerCase().includes("sade sati")) {
          reply = "Saturn is transiting Capricorn/Aquarius moon signs. Regular charity on Saturdays is recommended.";
        }
        setAiConversation(prev => [...prev, { 
          sender: "ai", 
          text: reply, 
          context: aiSelectedMember ? familyMembers.find(m => m.id === aiSelectedMember)?.name : "Self" 
        }]);
      }, 800);
    }
  };

  const handleBookConsultation = async () => {
    if (!selectedAstrologer) return;

    const payload = {
      userId: familyMembers[0]?.userId || "00000000-0000-0000-0000-000000000000",
      astrologerId: selectedAstrologer.id,
      scheduledAt: `${bookingDate}T${bookingTime}:00Z`,
      durationMinutes: 30,
      type: "Video",
      notes: bookingNotes
    };

    try {
      const res = await fetch(`${API_BASE}/marketplace/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert("Consultation booked successfully!");
        loadAppointments();
        setSelectedAstrologer(null);
      }
    } catch {
      alert("Consultation booked! (Saved locally)");
      setAppointments(prev => [...prev, {
        id: `ap_${Date.now()}`,
        scheduledAt: payload.scheduledAt,
        durationMinutes: 30,
        type: "Video",
        status: "Scheduled",
        meetingUrl: "https://meet.jit.si/astroverse-session",
        astrologerName: selectedAstrologer.fullName
      }]);
      setSelectedAstrologer(null);
    }
  };

  const handleUpgradeSubscription = async (plan: string) => {
    const payload = {
      userId: familyMembers[0]?.userId || "00000000-0000-0000-0000-000000000000",
      planType: plan
    };

    try {
      const res = await fetch(`${API_BASE}/subscription/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        loadSubscriptionStatus();
        loadMetrics();
        setShowBillingModal(false);
        alert(`Successfully upgraded to ${plan} Plan!`);
      }
    } catch {
      setSubscription({
        planType: plan,
        endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        limits: plan === "Basic" 
          ? { maxFamilyMembers: 5, hasAiAssistant: true } 
          : { maxFamilyMembers: 9999, hasAiAssistant: true }
      });
      setShowBillingModal(false);
      alert(`Upgraded to ${plan}! (Simulated locally)`);
    }
  };

  const handleAddTranslation = async () => {
    if (!newTransKey.trim()) return;

    try {
      await fetch(`${API_BASE}/admin/translations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ languageCode: "en", key: newTransKey, value: newTransValEn })
      });
      if (newTransValHi) {
        await fetch(`${API_BASE}/admin/translations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ languageCode: "hi", key: newTransKey, value: newTransValHi })
        });
      }
      if (newTransValAr) {
        await fetch(`${API_BASE}/admin/translations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ languageCode: "ar", key: newTransKey, value: newTransValAr })
        });
      }
      loadTranslations();
      setNewTransKey("");
      setNewTransValEn("");
      setNewTransValHi("");
      setNewTransValAr("");
      alert("Translation updated successfully!");
    } catch {
      setTranslationsList(prev => [
        ...prev,
        { id: `tr_${Date.now()}`, languageCode: "en", key: newTransKey, value: newTransValEn },
        { id: `tr_hi_${Date.now()}`, languageCode: "hi", key: newTransKey, value: newTransValHi }
      ]);
      setNewTransKey("");
      setNewTransValEn("");
      setNewTransValHi("");
      setNewTransValAr("");
      alert("Translation updated locally!");
    }
  };

  // --- Astrological Engine Simulations ---
  const TimeSpanParse = (timeStr: string): any => {
    const parts = timeStr.split(":");
    return { Hours: parseInt(parts[0]), Minutes: parseInt(parts[1]) };
  };

  const mockGenerateKundli = (name: string, gender: string, dob: Date, tob: any, lat: number, lng: number, place: string) => {
    const birthYear = dob.getFullYear();
    // Deterministic calculation based on Date of Birth, time of birth, and location coordinates
    const latFactor = Math.abs(Math.round(lat * 1000));
    const lngFactor = Math.abs(Math.round(lng * 1000));
    const seed = (dob.getDate() + dob.getMonth() + tob.Hours + latFactor + lngFactor) % 12;
    const rashi = Rashis[seed % 12];
    const nakshatra = Nakshatras[(dob.getDate() + dob.getMonth() + latFactor) % 27];
    
    // Ascendant shifts roughly every 2 hours, adjusted by longitude time zone offset (15 degrees per hour)
    const longitudeOffsetHours = Math.round(lng / 15.0);
    const adjustedHours = (tob.Hours + longitudeOffsetHours + 12) % 24;
    const ascendant = Rashis[Math.floor(adjustedHours / 2) % 12];

    const houses: Record<string, string[]> = {
      house1: ["Asc"], house2: [], house3: [], house4: [], house5: [], house6: [],
      house7: [], house8: [], house9: [], house10: [], house11: [], house12: []
    };

    const planets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ket"];
    planets.forEach((p, idx) => {
      let hNum;
      if (p === "Rahu") hNum = (seed + 3) % 12 + 1;
      else if (p === "Ket") hNum = ((seed + 3) % 12 + 1 + 6 - 1) % 12 + 1;
      else hNum = (seed + idx * 2) % 12 + 1;
      
      houses[`house${hNum}`].push(p);
    });

    const tithis = ["Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shasthi", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima", "Krishna Pratipada", "Krishna Dwitiya", "Krishna Tritiya", "Krishna Chaturthi", "Krishna Panchami", "Krishna Shasthi", "Krishna Saptami", "Krishna Ashtami", "Krishna Navami", "Krishna Dashami", "Krishna Ekadashi", "Krishna Dwadashi", "Krishna Trayodashi", "Krishna Chaturdashi", "Amavasya"];
    const yogasList = ["Vishkumbha", "Preeti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti", "Shoola", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyan", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"];
    const karanas = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti", "Shakuni", "Chatushpada", "Naga", "Kintughna"];
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const varnas = ["Brahmana", "Kshatriya", "Vaishya", "Shudra"];
    const vashyas = ["Chatushpad (Quadruped)", "Vanachar (Wild)", "Jalachar (Water)", "Keet (Insect)", "Nara (Human)"];
    const yonis = ["Ashwa (Horse)", "Gaja (Elephant)", "Mesha (Sheep)", "Shwan (Dog)", "Marjara (Cat)", "Mushaka (Rat)", "Gau (Cow)", "Mahisha (Buffalo)", "Vyaghra (Tiger)", "Mriga (Deer)", "Vanar (Monkey)", "Nakula (Mongoose)", "Singha (Lion)", "Sarpa (Snake)"];
    const ganas = ["Deva (Divine)", "Manushya (Human)", "Rakshasa (Demonic)"];
    const nadis = ["Adi", "Madhya", "Antya"];

    const rashiLords: Record<string, string> = {
      "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury",
      "Cancer": "Moon", "Leo": "Sun", "Virgo": "Mercury",
      "Libra": "Venus", "Scorpio": "Mars", "Sagittarius": "Jupiter",
      "Capricorn": "Saturn", "Aquarius": "Saturn", "Pisces": "Jupiter"
    };

    const panchangObj = {
      Tithi: tithis[seed % 30],
      Yoga: yogasList[seed % 27],
      Karana: karanas[seed % 11],
      VedicDay: days[dob.getDay() % 7],
      Ayanamsha: `24° ${(seed * 3) % 60}' ${(seed * 11) % 60}"`,
      Sunrise: "05:48 AM",
      Sunset: "06:42 PM",
      Charan: (seed % 4) + 1,
      Varna: varnas[seed % 4],
      Vashya: vashyas[seed % 5],
      Yoni: yonis[seed % 14],
      Gana: ganas[seed % 3],
      Nadi: nadis[seed % 3],
      AscendantLord: rashiLords[ascendant] || "Sun",
      MoonSignLord: rashiLords[rashi] || "Moon"
    };

    const predictionsObj = {
      Education: [
        "Benefic Jupiter and Mercury placement indicates outstanding intellect, strong academic foundations, and high logical reasoning. Success in technical or scientific domains. Promising prospects for advanced studies or research.",
        "Favorable Mercury alignment offers excellent comprehension and writing capabilities. Great aptitude for literature, journalism, communications, and social sciences. Academic achievements through creative projects.",
        "Practical, result-oriented learning nature. Strong logical analysis and competitive drive. Highly suitable for management, engineering, or legal studies. Excels in business case analyses."
      ][seed % 3],
      Health: [
        "Generally robust physical constitution (Prakriti). High physical endurance. Watch out for stress-related headaches or eye strain. Incorporating outdoor walks and yoga in the morning will greatly boost longevity.",
        "Good core immunity and metabolism. Need to stay hydrated and take care of dietary hygiene to avoid acidity or gut sensitivity. A balanced vegetarian diet will enhance physical vitality.",
        "High mental and physical energy. Guard against joint stiffness or seasonal allergies. Regular detox programs and Ayurvedic herbs like Ashwagandha will maintain optimum vital forces."
      ][seed % 3],
      LivingStyle: [
        "Values structured, aesthetic, and clean environments. Inclined towards gardening, open spaces, or writing rooms. Enjoys cosmic silence and prefers a well-organized lifestyle.",
        "Dynamic, active lifestyle with regular travels. Prefers modern urban living with access to cultural hubs, social events, and sports activities. Values personal space and luxury assets.",
        "Reflective, spiritual lifestyle. Prefers a quiet home environment with dedicated corners for meditation or study. Enjoys natural scenery and values deep personal relationships over large social groups."
      ][seed % 3],
      Nature: [
        "Deeply analytical, sincere, and intuitive. You have a quiet exterior but are highly creative inside. Extremely loyal to loved ones, though sometimes reserved in expressing emotions.",
        "Assertive, charismatic, and natural leader. You possess strong self-motivation and inspire others with your courage. Direct in communication and stands firm on moral principles.",
        "Diplomatic, empathetic, and peace-loving. You possess high emotional intelligence and search for balance in relationships. A natural mediator with an artistic imagination."
      ][seed % 3],
      Money: [
        "Steady accumulation of wealth through structural investments and professional growth. Key property or real estate purchase is highly favorable between ages 28 and 32.",
        "Dynamic financial graph. Sudden gains through investments or creative entrepreneurship. Financial prosperity peaks after age 30, supported by smart asset diversification.",
        "Highly prosperous chart for finance. Gains from consulting, advisory roles, or writing. Strong planetary support ensures regular cash flow and comfort throughout life."
      ][seed % 3],
      Age: [
        "Strong planetary chart indicating robust longevity (Dirghayu). Major shifts in life chapters around age 32 and 48, bringing immense wisdom and spiritual evolution.",
        "Longevity is favored with high physical resilience. Safe passage through major Saturn transits. Adapting spiritual disciplines will secure robust physical health during later years.",
        "Good life span with general wellness. Major milestones and career transitions at age 35. Gemstones like Yellow Sapphire or Ruby will further safeguard health during planetary Dashas."
      ][seed % 3],
      BigEvents: [
        `Significant professional breakthrough and recognition between age 26-28. Favorable marriage or partnership window around year ${birthYear + 28}-${birthYear + 30}. Major international travel or relocation in year ${birthYear + 33}.`,
        `Academic milestone or key publication at age 24. Favorable vehicle or property purchase in year ${birthYear + 31}. Deep spiritual realization or transition to leadership roles in year ${birthYear + 36}.`,
        `Independent business launch or senior leadership role at age 31. Marriage or birth of child brings family fortune in year ${birthYear + 29}-${birthYear + 30}. High public awards or honors in year ${birthYear + 34}.`
      ][seed % 3]
    };

    return {
      Rashi: rashi,
      Nakshatra: nakshatra,
      Ascendant: ascendant,
      LagnaChartData: JSON.stringify(houses),
      NavamsaChartData: JSON.stringify(houses),
      PlanetaryPositions: JSON.stringify(planets.map((p, idx) => ({
        planet: p,
        degree: `${(seed * idx + 14) % 30}°24'`,
        house: (seed + idx * 2) % 12 + 1
      }))),
      Yogas: JSON.stringify([{ name: "Budhaditya Yoga", description: "Sun and Mercury conjunction provides strong intellectual skills." }]),
      Doshas: JSON.stringify({ isManglik: seed % 3 === 0, manglikSeverity: "Mild", sadeSatiStatus: "No Sade Sati." }),
      Panchang: JSON.stringify(panchangObj),
      Predictions: JSON.stringify(predictionsObj)
    };
  };

  const mockCompatibilityScore = (primary: FamilyMember, secondary: FamilyMember) => {
    const pSeed = (primary.dateOfBirth.charCodeAt(5) + primary.name.charCodeAt(0)) % 10;
    const sSeed = (secondary.dateOfBirth.charCodeAt(5) + secondary.name.charCodeAt(0)) % 10;
    const score = Math.round(18 + ((pSeed + sSeed) % 18) + Math.random() * 2);
    const percentage = Math.round((score / 36) * 100);

    return {
      GunaMilanScore: score,
      CompatibilityScore: percentage,
      ManglikStatus: JSON.stringify({ primaryIsManglik: pSeed % 2 === 0, secondaryIsManglik: sSeed % 2 === 0 }),
      DoshaAnalysis: JSON.stringify({ nadiDosha: score % 7 === 0, bhakootDosha: score % 9 === 0, remedyText: "Donate grains to local temple." }),
      Recommendations: score >= 18 
        ? "Match is favorable. High relationship resilience."
        : "Moderate compatibility. Perform remedial prayers for Nadi Dosha."
    };
  };

  const Rashis = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  const Nakshatras = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashirsha", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
  ];

  // --- SVG Chart Renderer ---
  const renderNorthIndianChart = (chartJson: string) => {
    if (!chartJson) return null;
    let data: Record<string, string[]> = {};
    try { data = JSON.parse(chartJson); } catch { return null; }

    const getPlanetsString = (houseKey: string) => {
      return data[houseKey]?.join(", ") || "";
    };

    return (
      <svg viewBox="0 0 200 200" className="w-full aspect-square max-w-[280px] border border-white/20 rounded-lg bg-black/40">
        {/* Draw Outer Square */}
        <rect x="10" y="10" width="180" height="180" className="chart-line" />
        {/* Draw Inner Diagonals */}
        <line x1="10" y1="10" x2="190" y2="190" className="chart-line" />
        <line x1="190" y1="10" x2="10" y2="190" className="chart-line" />
        {/* Draw Inner Diamond */}
        <line x1="100" y1="10" x2="10" y2="100" className="chart-line" />
        <line x1="10" y1="100" x2="100" y2="190" className="chart-line" />
        <line x1="100" y1="190" x2="190" y2="100" className="chart-line" />
        <line x1="190" y1="100" x2="100" y2="1" className="chart-line" />

        {/* House Numbers & Planets Labels */}
        <text x="100" y="45" className="chart-planet">{getPlanetsString("house1")}</text>
        <text x="100" y="55" className="chart-text">1 (Lagna)</text>

        <text x="50" y="25" className="chart-planet">{getPlanetsString("house2")}</text>
        <text x="50" y="35" className="chart-text">2</text>

        <text x="25" y="50" className="chart-planet">{getPlanetsString("house3")}</text>
        <text x="25" y="60" className="chart-text">3</text>

        <text x="50" y="100" className="chart-planet">{getPlanetsString("house4")}</text>
        <text x="50" y="110" className="chart-text">4</text>

        <text x="25" y="140" className="chart-planet">{getPlanetsString("house5")}</text>
        <text x="25" y="150" className="chart-text">5</text>

        <text x="50" y="170" className="chart-planet">{getPlanetsString("house6")}</text>
        <text x="50" y="180" className="chart-text">6</text>

        <text x="100" y="145" className="chart-planet">{getPlanetsString("house7")}</text>
        <text x="100" y="155" className="chart-text">7</text>

        <text x="150" y="170" className="chart-planet">{getPlanetsString("house8")}</text>
        <text x="150" y="180" className="chart-text">8</text>

        <text x="175" y="140" className="chart-planet">{getPlanetsString("house9")}</text>
        <text x="175" y="150" className="chart-text">9</text>

        <text x="150" y="100" className="chart-planet">{getPlanetsString("house10")}</text>
        <text x="150" y="110" className="chart-text">10</text>

        <text x="175" y="50" className="chart-planet">{getPlanetsString("house11")}</text>
        <text x="175" y="60" className="chart-text">11</text>

        <text x="150" y="25" className="chart-planet">{getPlanetsString("house12")}</text>
        <text x="150" y="35" className="chart-text">12</text>
      </svg>
    );
  };

  const renderSouthIndianChart = (chartJson: string) => {
    if (!chartJson) return null;
    let data: Record<string, string[]> = {};
    try { data = JSON.parse(chartJson); } catch { return null; }

    // South Indian Chart maps Aries (top-second cell) through Pisces clockwise.
    // We can map houses 1-12 relative to Ascendant dynamically.
    const cells = [
      { id: "12", x: 0, y: 0 }, { id: "1", x: 50, y: 0 }, { id: "2", x: 100, y: 0 }, { id: "3", x: 150, y: 0 },
      { id: "11", x: 0, y: 50 },                                                     { id: "4", x: 150, y: 50 },
      { id: "10", x: 0, y: 100 },                                                    { id: "5", x: 150, y: 100 },
      { id: "9", x: 0, y: 150 },  { id: "8", x: 50, y: 150 }, { id: "7", x: 100, y: 150 }, { id: "6", x: 150, y: 150 }
    ];

    return (
      <svg viewBox="0 0 200 200" className="w-full aspect-square max-w-[280px] border border-white/20 rounded-lg bg-black/40">
        {/* Draw outer border */}
        <rect x="0" y="0" width="200" height="200" className="chart-line" />
        
        {/* Draw internal grid lines */}
        <line x1="50" y1="0" x2="50" y2="200" className="chart-line" />
        <line x1="100" y1="0" x2="100" y2="200" className="chart-line" />
        <line x1="150" y1="0" x2="150" y2="200" className="chart-line" />
        
        <line x1="0" y1="50" x2="200" y2="50" className="chart-line" />
        <line x1="0" y1="100" x2="200" y2="100" className="chart-line" />
        <line x1="0" y1="150" x2="200" y2="150" className="chart-line" />

        {cells.map(c => (
          <g key={c.id}>
            <text x={c.x + 25} y={c.y + 40} className="chart-text">{c.id}</text>
            <text x={c.x + 25} y={c.y + 25} className="chart-planet">{data[`house${c.id}`]?.join(", ") || ""}</text>
          </g>
        ))}
      </svg>
    );
  };

  if (!authToken) {
    return (
      <div className="min-h-screen bg-[#0a0b1e] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Glowing Background Blob */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[80px] -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-amber-600/10 blur-[90px] -z-10" />

        <div className="w-full max-w-md space-y-8 animate-fadeIn">
          
          {/* Logo Brand Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center animate-spin-slow">
              <Sparkles className="h-6 w-6 text-amber-400" />
            </div>
            <h1 className="text-3xl font-extrabold text-amber-400 tracking-wider">AstroVerse</h1>
            <p className="text-xs text-muted-foreground">Premium Single-Tenant SaaS Astrology Vault</p>
          </div>

          {/* Form Card container */}
          <div className="glass-card p-8 rounded-3xl space-y-6 border-white/5">
            
            {/* Mode Selectors */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
              <button 
                onClick={() => { setAuthMode("login"); setShowOtpField(false); }}
                className={`flex-1 py-2 rounded-lg font-bold transition-colors ${authMode === "login" ? "bg-amber-400 text-[#0a0b1e]" : "text-muted-foreground"}`}
              >
                Sign In
              </button>
              <button 
                onClick={() => { setAuthMode("register"); setShowOtpField(false); }}
                className={`flex-1 py-2 rounded-lg font-bold transition-colors ${authMode === "register" ? "bg-amber-400 text-[#0a0b1e]" : "text-muted-foreground"}`}
              >
                Register
              </button>
              <button 
                onClick={() => { setAuthMode("otp"); setShowOtpField(false); }}
                className={`flex-1 py-2 rounded-lg font-bold transition-colors ${authMode === "otp" ? "bg-amber-400 text-[#0a0b1e]" : "text-muted-foreground"}`}
              >
                OTP Login
              </button>
            </div>

            {/* Auth forms */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              
              {authMode === "register" && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Full Name</label>
                  <input 
                    type="text" required placeholder="e.g. John Doe" value={authName} onChange={(e) => setAuthName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-amber-400"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Email Address</label>
                <input 
                  type="email" required placeholder="name@domain.com" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-amber-400"
                />
              </div>

              {authMode !== "otp" && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Password</label>
                  <input 
                    type="password" required placeholder="••••••••" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-amber-400"
                  />
                </div>
              )}

              {authMode === "otp" && showOtpField && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="text-xs text-muted-foreground">Type 4-digit OTP Code</label>
                  <input 
                    type="text" placeholder="1234" value={authOtp} onChange={(e) => setAuthOtp(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-center font-bold tracking-widest outline-none focus:border-amber-400"
                  />
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-amber-400 hover:bg-amber-500 text-[#0a0b1e] font-extrabold py-3.5 rounded-xl text-xs transition-all active:scale-[0.98]"
              >
                {authMode === "login" ? "Access Vault" : authMode === "register" ? "Create Cosmic Profile" : showOtpField ? "Verify OTP" : "Request OTP Code"}
              </button>
            </form>

            {/* Social Authentication divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
              <span className="relative bg-[#0d0e2c] px-3 text-[10px] text-muted-foreground uppercase tracking-widest">or login with</span>
            </div>

            {/* Social Grid */}
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => handleSocialLogin("Google")}
                className="glass-card py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                Google
              </button>
              <button 
                onClick={() => handleSocialLogin("Apple")}
                className="glass-card py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                Apple
              </button>
              <button 
                onClick={() => handleSocialLogin("Facebook")}
                className="glass-card py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                Facebook
              </button>
            </div>

            {/* Demo Helpers Alert box */}
            <div className="bg-amber-400/10 border border-amber-400/20 p-4 rounded-2xl text-xs text-amber-400 space-y-1">
              <span className="font-bold uppercase tracking-wider block text-[10px]">Testing Credentials</span>
              <p>• User Profile: <span className="font-mono text-white">user@astroverse.com</span> / <span className="font-mono text-white">User@123</span></p>
              <p>• Admin Profile: <span className="font-mono text-white">admin@astroverse.com</span> / <span className="font-mono text-white">Admin@123</span></p>
              <p className="text-[10px] text-muted-foreground/80 mt-1">OTP Simulation Code: <span className="font-mono text-white">1234</span></p>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === "light" ? "light-theme" : ""}`} dir={rtl ? "rtl" : "ltr"}>
      
      {/* Background Glows */}
      <div className="cosmic-glow top-10 left-10" />
      <div className="cosmic-glow-gold bottom-20 right-10" />

      {/* Header Panel */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-black/20 border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/20 border border-primary/40 rounded-full flex items-center justify-center animate-pulse">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary tracking-wide">AstroVerse</h1>
            <p className="text-xs text-muted-foreground">SaaS Astrology Engine</p>
          </div>
        </div>

        {/* Global Control Widgets */}
        <div className="flex items-center gap-4">
          
          {/* Language Selector */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-sm">
            <Globe className="h-4 w-4 text-primary" />
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-foreground border-none outline-none text-xs cursor-pointer"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="ar">العربية (RTL)</option>
            </select>
          </div>

          {/* Theme switcher */}
          <button 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-primary" /> : <Moon className="h-4 w-4 text-primary" />}
          </button>

          {/* Plan badge */}
          <div className="hidden md:flex items-center gap-2 bg-primary/10 border border-primary/30 px-3 py-1 rounded-full text-xs font-semibold text-primary">
            <Award className="h-3 w-3" />
            {subscription.planType} Plan
          </div>

          {/* Upgrade Trigger */}
          <button 
            onClick={() => setActiveTab("upgrade")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 py-1.5 rounded-full text-xs transition-transform transform active:scale-95"
          >
            Upgrade
          </button>

        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-73px)]">
        
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 bg-black/10 border-r border-white/5 p-6 space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible">
          
          <button 
            onClick={() => setActiveTab("home")}
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors ${activeTab === "home" ? "bg-primary text-primary-foreground" : "hover:bg-white/5 text-muted-foreground"}`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Home Dashboard</span>
          </button>

          <button 
            onClick={() => setActiveTab("vault")}
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors ${activeTab === "vault" ? "bg-primary text-primary-foreground" : "hover:bg-white/5 text-muted-foreground"}`}
          >
            <Users className="h-4 w-4" />
            <span>{getT("nav_vault")}</span>
          </button>

          <button 
            onClick={() => setActiveTab("chart")}
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors ${activeTab === "chart" ? "bg-primary text-primary-foreground" : "hover:bg-white/5 text-muted-foreground"}`}
          >
            <MapPin className="h-4 w-4" />
            <span>Kundli Generator</span>
          </button>

          <button 
            onClick={() => setActiveTab("matchmaking")}
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors ${activeTab === "matchmaking" ? "bg-primary text-primary-foreground" : "hover:bg-white/5 text-muted-foreground"}`}
          >
            <Heart className="h-4 w-4" />
            <span>{getT("nav_compatibility")}</span>
          </button>

          <button 
            onClick={() => setActiveTab("planner")}
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors ${activeTab === "planner" ? "bg-primary text-primary-foreground" : "hover:bg-white/5 text-muted-foreground"}`}
          >
            <Calendar className="h-4 w-4" />
            <span>Muhurat & Naming</span>
          </button>

          <button 
            onClick={() => setActiveTab("ai")}
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors ${activeTab === "ai" ? "bg-primary text-primary-foreground" : "hover:bg-white/5 text-muted-foreground"}`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>{getT("nav_ai_assistant")}</span>
          </button>

          <button 
            onClick={() => setActiveTab("marketplace")}
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors ${activeTab === "marketplace" ? "bg-primary text-primary-foreground" : "hover:bg-white/5 text-muted-foreground"}`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>{getT("nav_marketplace")}</span>
          </button>

          <button 
            onClick={() => setActiveTab("admin")}
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors ${activeTab === "admin" ? "bg-primary text-primary-foreground" : "hover:bg-white/5 text-muted-foreground"}`}
          >
            <Settings className="h-4 w-4" />
            <span>{getT("nav_admin")}</span>
          </button>

        </aside>

        {/* Dynamic Display Area */}
        <main className="flex-1 p-6 md:p-12 overflow-y-auto">
          
          {/* TAB 1: HOME WELCOME */}
          {activeTab === "home" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-4">
                <span className="text-xs font-bold text-primary tracking-widest uppercase">Overview</span>
                <h2 className="text-3xl md:text-5xl font-extrabold text-foreground">{getT("home_title")}</h2>
                <p className="text-muted-foreground text-lg max-w-2xl">{getT("home_subtitle")}</p>
              </div>

              {/* Grid Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Profile count widget */}
                <div className="glass-card p-6 rounded-2xl space-y-4 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary">
                      <Users className="h-6 w-6" />
                    </div>
                    <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded">Active</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{familyMembers.length} Profiles</h3>
                    <p className="text-xs text-muted-foreground">Stored inside Family Astro Vault</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab("vault")}
                    className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"
                  >
                    Manage Vault <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                {/* Consultation slots */}
                <div className="glass-card p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-xl text-secondary">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                    <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded">Confirmed</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{appointments.length} Consults</h3>
                    <p className="text-xs text-muted-foreground">Scheduled sessions with astrologers</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab("marketplace")}
                    className="text-xs text-secondary font-bold flex items-center gap-1 hover:underline"
                  >
                    View Marketplace <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                {/* Daily Horoscope Widget */}
                <div className="glass-card p-6 rounded-2xl space-y-4 md:col-span-1">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <span className="text-xs bg-white/5 px-2.5 py-0.5 rounded-full">Daily</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Aries Daily Horoscope</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Jupiter aspects your houses favorably. Stay focused on new creative efforts; budgets require attention.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab("chart")}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Check Rashi <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

              </div>

              {/* Action Banner */}
              <div className="glass-card p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 border-primary/20">
                <div className="space-y-2 text-center md:text-left">
                  <h3 className="text-2xl font-bold">Unveil the Cosmic Family Tree</h3>
                  <p className="text-muted-foreground text-sm max-w-xl">
                    Create profiles for parents, spouse, or siblings to generate dynamic compatibility scores and compare transits.
                  </p>
                </div>
                <button 
                  onClick={() => { setShowAddMember(true); setActiveTab("vault"); }}
                  className="bg-primary hover:bg-primary/95 text-primary-foreground font-extrabold px-6 py-3 rounded-full text-sm flex items-center gap-2 transform transition active:scale-95"
                >
                  <UserPlus className="h-4 w-4" /> Add Vault Profile
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: FAMILY ASTRO VAULT */}
          {activeTab === "vault" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-extrabold text-foreground">{getT("nav_vault")}</h2>
                  <p className="text-sm text-muted-foreground">Store details for self, children, spouse, or friends.</p>
                </div>
                <button 
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Add Profile
                </button>
              </div>

              {/* Vault Add Form */}
              {showAddMember && (
                <form onSubmit={handleAddMember} className="glass-card p-6 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4 border-primary/20">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                    <input 
                      type="text" required value={newName} onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Jane Doe" className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Gender</label>
                    <select 
                      value={newGender} onChange={(e) => setNewGender(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Unisex">Unisex</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Relationship</label>
                    <select 
                      value={newRelation} onChange={(e) => setNewRelation(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm outline-none"
                    >
                      <option value="Self">Self</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Child</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Friend">Friend</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Date of Birth</label>
                    <input 
                      type="date" required value={newDob} onChange={(e) => setNewDob(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Time of Birth</label>
                    <input 
                      type="time" required value={newTob} onChange={(e) => setNewTob(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm outline-none"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <LocationSelector
                      place={newPlace}
                      setPlace={setNewPlace}
                      lat={newLat}
                      setLat={setNewLat}
                      lng={newLng}
                      setLng={setNewLng}
                      idPrefix="add-profile"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Tags (comma separated)</label>
                    <input 
                      type="text" value={newTags} onChange={(e) => setNewTags(e.target.value)}
                      placeholder="e.g. Immediate, Partner" className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm outline-none"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Custom Notes</label>
                    <textarea 
                      value={newNotes} onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Astrological points, gemstone instructions, remedies"
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm outline-none"
                    />
                  </div>

                  <div className="md:col-span-3 flex justify-end gap-3">
                    <button 
                      type="button" onClick={() => setShowAddMember(false)}
                      className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-xs"
                    >
                      Save Profile
                    </button>
                  </div>
                </form>
              )}

              {/* Members vault Grid & Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Profiles Lists */}
                <div className="space-y-3 md:col-span-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vault Profiles</h3>
                  {familyMembers.map(m => (
                    <div 
                      key={m.id}
                      onClick={() => handleSelectVaultMember(m)}
                      className={`p-4 rounded-xl cursor-pointer flex justify-between items-center transition-colors border ${selectedVaultMember?.id === m.id ? "bg-primary/10 border-primary" : "glass-card border-transparent hover:border-white/10"}`}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={m.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.name}`}
                          className="h-10 w-10 bg-white/10 border border-white/15 rounded-full"
                          alt="Profile"
                        />
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{m.name}</h4>
                          <p className="text-xs text-muted-foreground">{m.relationType} • {m.gender}</p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteMember(m.id); }}
                        className="text-muted-foreground hover:text-red-400 p-1 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Selected Profile Detailed Astrological Vault Chart */}
                <div className="md:col-span-2">
                  {selectedVaultMember ? (
                    <div className="glass-card p-6 rounded-2xl space-y-6 animate-fadeIn">
                      
                      <div className="flex flex-col space-y-3 border-b border-white/5 pb-6">
                        <div className="flex justify-between items-center w-full">
                          <div className="flex items-center gap-4">
                            <img 
                              src={selectedVaultMember.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedVaultMember.name}`}
                              className="h-16 w-16 bg-white/10 rounded-full border border-white/20"
                              alt="Avatar"
                            />
                            <div>
                              <h3 className="text-2xl font-bold">{selectedVaultMember.name}</h3>
                              <p className="text-sm text-primary font-medium">{selectedVaultMember.relationType}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handlePrintPdf(vaultMemberKundli, selectedVaultMember.name, selectedVaultMember.gender, selectedVaultMember.dateOfBirth.split('T')[0], selectedVaultMember.timeOfBirth, selectedVaultMember.placeOfBirth)} 
                            className="bg-amber-400 hover:bg-amber-500 text-black font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow transition-transform active:scale-95"
                          >
                            <Award className="h-3.5 w-3.5" /> Download Janam Patrika (PDF)
                          </button>
                        </div>
                        <div className="text-xs text-muted-foreground bg-white/5 p-3 rounded-xl border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <p><span className="font-semibold text-foreground">Birth Details:</span> {selectedVaultMember.dateOfBirth.split('T')[0]} @ {selectedVaultMember.timeOfBirth.substring(0, 5)}</p>
                          <p><span className="font-semibold text-foreground">Location:</span> {selectedVaultMember.placeOfBirth} ({selectedVaultMember.latitude}°N, {selectedVaultMember.longitude}°E)</p>
                        </div>
                      </div>

                      {/* Display Precomputed Kundli details */}
                      {vaultMemberKundli ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            {/* Side-by-side Charts */}
                            <div className="space-y-6 bg-black/20 p-4 rounded-2xl border border-white/5">
                              <div>
                                <span className="text-xs font-bold uppercase tracking-widest text-primary block mb-2">Lagna Birth Chart (D-1)</span>
                                <div className="flex items-center justify-center">
                                  {selectedChartStyle === "north" 
                                    ? renderNorthIndianChart(vaultMemberKundli.LagnaChartData)
                                    : renderSouthIndianChart(vaultMemberKundli.LagnaChartData)}
                                </div>
                              </div>
                              <div className="border-t border-white/5 pt-4">
                                <span className="text-xs font-bold uppercase tracking-widest text-primary block mb-2">Navamsa Chart (D-9)</span>
                                <div className="flex items-center justify-center">
                                  {selectedChartStyle === "north" 
                                    ? renderNorthIndianChart(vaultMemberKundli.NavamsaChartData)
                                    : renderSouthIndianChart(vaultMemberKundli.NavamsaChartData)}
                                </div>
                              </div>
                            </div>

                            {/* Astrological Parameters */}
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Vedic Coordinates</h4>
                              
                              <div className="grid grid-cols-3 gap-2">
                                <div className="bg-white/5 p-2 rounded-xl border border-white/10 text-center">
                                  <span className="text-[9px] text-muted-foreground uppercase">Rashi</span>
                                  <p className="text-[11px] font-bold text-foreground mt-0.5">{vaultMemberKundli.Rashi}</p>
                                </div>
                                <div className="bg-white/5 p-2 rounded-xl border border-white/10 text-center">
                                  <span className="text-[9px] text-muted-foreground uppercase">Nakshatra</span>
                                  <p className="text-[11px] font-bold text-foreground mt-0.5">{vaultMemberKundli.Nakshatra}</p>
                                </div>
                                <div className="bg-white/5 p-2 rounded-xl border border-white/10 text-center">
                                  <span className="text-[9px] text-muted-foreground uppercase">Ascendant</span>
                                  <p className="text-[11px] font-bold text-foreground mt-0.5">{vaultMemberKundli.Ascendant}</p>
                                </div>
                              </div>

                              {/* Detailed Panchang Grid */}
                              {vaultMemberKundli.Panchang && (
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                                  <span className="text-[11px] text-primary font-bold block uppercase tracking-wider">Vedic Panchang Details</span>
                                  {(() => {
                                    const p = typeof vaultMemberKundli.Panchang === "string" ? JSON.parse(vaultMemberKundli.Panchang) : vaultMemberKundli.Panchang;
                                    return (
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="border-b border-white/5 pb-1 flex justify-between">
                                          <span className="text-muted-foreground">Tithi:</span>
                                          <span className="font-semibold">{p.Tithi}</span>
                                        </div>
                                        <div className="border-b border-white/5 pb-1 flex justify-between">
                                          <span className="text-muted-foreground">Vedic Day:</span>
                                          <span className="font-semibold">{p.VedicDay}</span>
                                        </div>
                                        <div className="border-b border-white/5 pb-1 flex justify-between">
                                          <span className="text-muted-foreground">Yoga:</span>
                                          <span className="font-semibold">{p.Yoga}</span>
                                        </div>
                                        <div className="border-b border-white/5 pb-1 flex justify-between">
                                          <span className="text-muted-foreground">Karana:</span>
                                          <span className="font-semibold">{p.Karana}</span>
                                        </div>
                                        <div className="border-b border-white/5 pb-1 flex justify-between">
                                          <span className="text-muted-foreground">Charan / Pada:</span>
                                          <span className="font-semibold">Pada {p.Charan}</span>
                                        </div>
                                        <div className="border-b border-white/5 pb-1 flex justify-between">
                                          <span className="text-muted-foreground">Lagna Lord:</span>
                                          <span className="font-semibold">{p.AscendantLord}</span>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                              {/* Avakahada Attributes */}
                              {vaultMemberKundli.Panchang && (
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                                  <span className="text-[11px] text-primary font-bold block uppercase tracking-wider">Avakahada Chakra Attributes</span>
                                  {(() => {
                                    const p = typeof vaultMemberKundli.Panchang === "string" ? JSON.parse(vaultMemberKundli.Panchang) : vaultMemberKundli.Panchang;
                                    return (
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="border-b border-white/5 pb-1 flex justify-between">
                                          <span className="text-muted-foreground">Varna:</span>
                                          <span className="font-semibold">{p.Varna}</span>
                                        </div>
                                        <div className="border-b border-white/5 pb-1 flex justify-between">
                                          <span className="text-muted-foreground">Vashya:</span>
                                          <span className="font-semibold">{p.Vashya}</span>
                                        </div>
                                        <div className="border-b border-white/5 pb-1 flex justify-between">
                                          <span className="text-muted-foreground">Yoni:</span>
                                          <span className="font-semibold">{p.Yoni}</span>
                                        </div>
                                        <div className="border-b border-white/5 pb-1 flex justify-between">
                                          <span className="text-muted-foreground">Gana:</span>
                                          <span className="font-semibold">{p.Gana}</span>
                                        </div>
                                        <div className="border-b border-white/5 pb-1 flex justify-between">
                                          <span className="text-muted-foreground">Nadi:</span>
                                          <span className="font-semibold">{p.Nadi}</span>
                                        </div>
                                        <div className="border-b border-white/5 pb-1 flex justify-between">
                                          <span className="text-muted-foreground">Rashi Lord:</span>
                                          <span className="font-semibold">{p.MoonSignLord}</span>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                              {/* Planetary degrees list */}
                              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                                <h5 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Planetary Degrees</h5>
                                <div className="h-40 overflow-y-auto space-y-1.5 text-xs pr-2">
                                  {JSON.parse(vaultMemberKundli.PlanetaryPositions).map((p: any) => (
                                    <div key={p.planet} className="flex justify-between py-1 border-b border-white/5">
                                      <span className="font-semibold text-foreground">{p.planet}</span>
                                      <span className="text-muted-foreground">{p.rashi} ({p.degree})</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                          </div>

                          {/* Dasha vimshottari analysis */}
                          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Vimshottari Dasha Outlook</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {JSON.parse(vaultMemberKundli.DashaAnalysis).slice(0, 3).map((d: any) => (
                                <div key={d.mahadasha} className="bg-black/20 p-3 rounded-lg border border-white/5">
                                  <span className="text-xs text-primary font-bold">{d.mahadasha} Mahadasha</span>
                                  <div className="text-[11px] text-muted-foreground mt-1">
                                    <p>Start: {d.start}</p>
                                    <p>End: {d.end}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Detailed Predictions */}
                          {vaultMemberKundli.Predictions && (
                            <div className="border-t border-white/5 pt-6 space-y-4">
                              <span className="text-sm text-primary font-bold block uppercase tracking-widest">Comprehensive Life Predictions</span>
                              {(() => {
                                const pred = typeof vaultMemberKundli.Predictions === "string" ? JSON.parse(vaultMemberKundli.Predictions) : vaultMemberKundli.Predictions;
                                return (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2 hover:border-primary/20 transition-colors">
                                      <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-wide">
                                        <Sparkles className="h-4 w-4" /> Nature & Temperament
                                      </div>
                                      <p className="text-muted-foreground leading-relaxed">{pred.Nature}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2 hover:border-primary/20 transition-colors">
                                      <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-wide">
                                        <Award className="h-4 w-4" /> Education & Intellect
                                      </div>
                                      <p className="text-muted-foreground leading-relaxed">{pred.Education}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2 hover:border-primary/20 transition-colors">
                                      <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-wide">
                                        <Sun className="h-4 w-4" /> Health & Vitality
                                      </div>
                                      <p className="text-muted-foreground leading-relaxed">{pred.Health}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2 hover:border-primary/20 transition-colors">
                                      <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-wide">
                                        <MapPin className="h-4 w-4" /> Lifestyle & Habitat
                                      </div>
                                      <p className="text-muted-foreground leading-relaxed">{pred.LivingStyle}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2 hover:border-primary/20 transition-colors">
                                      <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-wide">
                                        <Award className="h-4 w-4" /> Wealth & Finance
                                      </div>
                                      <p className="text-muted-foreground leading-relaxed">{pred.Money}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2 hover:border-primary/20 transition-colors">
                                      <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-wide">
                                        <Sun className="h-4 w-4" /> Age & Longevity
                                      </div>
                                      <p className="text-muted-foreground leading-relaxed">{pred.Age}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 md:col-span-2 space-y-2 hover:border-primary/20 transition-colors">
                                      <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-wide">
                                        <Calendar className="h-4 w-4" /> Major Life Events & Milestones
                                      </div>
                                      <p className="text-muted-foreground leading-relaxed">{pred.BigEvents}</p>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">Pre-calculating birth configuration coordinates...</p>
                      )}

                    </div>
                  ) : (
                    <div className="glass-card h-80 rounded-2xl flex flex-col items-center justify-center text-center p-6 border-dashed">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="font-bold text-lg">Select a Profile</h3>
                      <p className="text-xs text-muted-foreground max-w-xs mt-1">
                        Select a family member profile from the vault to inspect their planetary locations, Vimshottari Dashas, and Lagna charts.
                      </p>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: KUNDLI GENERATOR */}
          {activeTab === "chart" && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h2 className="text-3xl font-extrabold text-foreground">Kundli Generator</h2>
                <p className="text-sm text-muted-foreground">Input birth settings to render astronomical planetary coordinates.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Generator Input Form */}
                <form onSubmit={handleCreateKundli} className="glass-card p-6 rounded-2xl space-y-4 md:col-span-1 h-fit">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Name</label>
                    <input 
                      type="text" required placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Gender</label>
                    <select 
                      value={newGender} onChange={(e) => setNewGender(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Birth Date</label>
                    <input 
                      type="date" required value={newDob} onChange={(e) => setNewDob(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Birth Time</label>
                    <input 
                      type="time" required value={newTob} onChange={(e) => setNewTob(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm outline-none"
                    />
                  </div>

                  <LocationSelector
                    place={newPlace}
                    setPlace={setNewPlace}
                    lat={newLat}
                    setLat={setNewLat}
                    lng={newLng}
                    setLng={setNewLng}
                    idPrefix="generator"
                  />

                  <button 
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-1"
                  >
                    <Sparkles className="h-4 w-4" /> Calculate Birth Configuration
                  </button>
                </form>

                {/* Live SVG Render Output */}
                <div className="md:col-span-2">
                  {kundliReport ? (
                    <div className="glass-card p-6 rounded-2xl space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
                        <div>
                          <h3 className="text-xl font-bold">Birth Chart: {newName || "Self"}</h3>
                          <p className="text-xs text-muted-foreground">Generated dynamically via local Astrological engine</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => setSelectedChartStyle("north")} 
                            className={`px-3 py-1.5 rounded-lg text-xs ${selectedChartStyle === "north" ? "bg-primary text-primary-foreground font-bold" : "bg-white/5"}`}
                          >
                            North Style
                          </button>
                          <button 
                            onClick={() => setSelectedChartStyle("south")} 
                            className={`px-3 py-1.5 rounded-lg text-xs ${selectedChartStyle === "south" ? "bg-primary text-primary-foreground font-bold" : "bg-white/5"}`}
                          >
                            South Style
                          </button>
                          <button 
                            onClick={() => handlePrintPdf(kundliReport, newName || "Self", newGender, newDob, newTob, newPlace)} 
                            className="bg-amber-400 hover:bg-amber-500 text-black font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow transition-transform active:scale-95"
                          >
                            <Award className="h-3.5 w-3.5" /> Download Janam Patrika (PDF)
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Side-by-side Charts */}
                        <div className="space-y-6 bg-black/20 p-4 rounded-2xl border border-white/5">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-primary block mb-2">Lagna Birth Chart (D-1)</span>
                            <div className="flex items-center justify-center">
                              {selectedChartStyle === "north" 
                                ? renderNorthIndianChart(kundliReport.LagnaChartData)
                                : renderSouthIndianChart(kundliReport.LagnaChartData)}
                            </div>
                          </div>
                          <div className="border-t border-white/5 pt-4">
                            <span className="text-xs font-bold uppercase tracking-widest text-primary block mb-2">Navamsa Chart (D-9)</span>
                            <div className="flex items-center justify-center">
                              {selectedChartStyle === "north" 
                                ? renderNorthIndianChart(kundliReport.NavamsaChartData)
                                : renderSouthIndianChart(kundliReport.NavamsaChartData)}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Chart Parameters</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                              <span className="text-[10px] text-muted-foreground block uppercase">Moon Sign (Rashi)</span>
                              <span className="font-bold">{kundliReport.Rashi}</span>
                            </div>
                            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                              <span className="text-[10px] text-muted-foreground block uppercase">Nakshatra</span>
                              <span className="font-bold">{kundliReport.Nakshatra}</span>
                            </div>
                          </div>

                          {/* Detailed Panchang Grid */}
                          {kundliReport.Panchang && (
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                              <span className="text-[11px] text-primary font-bold block uppercase tracking-wider">Vedic Panchang Details</span>
                              {(() => {
                                const p = typeof kundliReport.Panchang === "string" ? JSON.parse(kundliReport.Panchang) : kundliReport.Panchang;
                                return (
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="border-b border-white/5 pb-1 flex justify-between">
                                      <span className="text-muted-foreground">Tithi:</span>
                                      <span className="font-semibold">{p.Tithi}</span>
                                    </div>
                                    <div className="border-b border-white/5 pb-1 flex justify-between">
                                      <span className="text-muted-foreground">Vedic Day:</span>
                                      <span className="font-semibold">{p.VedicDay}</span>
                                    </div>
                                    <div className="border-b border-white/5 pb-1 flex justify-between">
                                      <span className="text-muted-foreground">Yoga:</span>
                                      <span className="font-semibold">{p.Yoga}</span>
                                    </div>
                                    <div className="border-b border-white/5 pb-1 flex justify-between">
                                      <span className="text-muted-foreground">Karana:</span>
                                      <span className="font-semibold">{p.Karana}</span>
                                    </div>
                                    <div className="border-b border-white/5 pb-1 flex justify-between">
                                      <span className="text-muted-foreground">Charan / Pada:</span>
                                      <span className="font-semibold">Pada {p.Charan}</span>
                                    </div>
                                    <div className="border-b border-white/5 pb-1 flex justify-between">
                                      <span className="text-muted-foreground">Lagna Lord:</span>
                                      <span className="font-semibold">{p.AscendantLord}</span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {/* Avakahada Attributes */}
                          {kundliReport.Panchang && (
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                              <span className="text-[11px] text-primary font-bold block uppercase tracking-wider">Avakahada Chakra Attributes</span>
                              {(() => {
                                const p = typeof kundliReport.Panchang === "string" ? JSON.parse(kundliReport.Panchang) : kundliReport.Panchang;
                                return (
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="border-b border-white/5 pb-1 flex justify-between">
                                      <span className="text-muted-foreground">Varna:</span>
                                      <span className="font-semibold">{p.Varna}</span>
                                    </div>
                                    <div className="border-b border-white/5 pb-1 flex justify-between">
                                      <span className="text-muted-foreground">Vashya:</span>
                                      <span className="font-semibold">{p.Vashya}</span>
                                    </div>
                                    <div className="border-b border-white/5 pb-1 flex justify-between">
                                      <span className="text-muted-foreground">Yoni:</span>
                                      <span className="font-semibold">{p.Yoni}</span>
                                    </div>
                                    <div className="border-b border-white/5 pb-1 flex justify-between">
                                      <span className="text-muted-foreground">Gana:</span>
                                      <span className="font-semibold">{p.Gana}</span>
                                    </div>
                                    <div className="border-b border-white/5 pb-1 flex justify-between">
                                      <span className="text-muted-foreground">Nadi:</span>
                                      <span className="font-semibold">{p.Nadi}</span>
                                    </div>
                                    <div className="border-b border-white/5 pb-1 flex justify-between">
                                      <span className="text-muted-foreground">Rashi Lord:</span>
                                      <span className="font-semibold">{p.MoonSignLord}</span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                            <span className="text-xs text-primary font-bold block">Yogas Present</span>
                            <div className="space-y-2 text-xs">
                              {JSON.parse(kundliReport.Yogas).map((y: any) => (
                                <div key={y.name} className="border-l-2 border-primary pl-2 py-0.5">
                                  <h5 className="font-bold text-foreground">{y.name}</h5>
                                  <p className="text-muted-foreground text-[11px] mt-0.5">{y.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                            <span className="text-xs text-primary font-bold block">Dosha Analysis</span>
                            <div className="text-xs space-y-1 text-muted-foreground">
                              <p>• Manglik: <span className="font-semibold text-foreground">{JSON.parse(kundliReport.Doshas).isManglik ? "Yes (Mild)" : "No"}</span></p>
                              <p>• Sade Sati: <span className="font-semibold text-foreground">{JSON.parse(kundliReport.Doshas).sadeSatiStatus}</span></p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Comprehensive Life Predictions */}
                      {kundliReport.Predictions && (
                        <div className="border-t border-white/5 pt-6 space-y-4">
                          <span className="text-sm text-primary font-bold block uppercase tracking-widest">Comprehensive Life Predictions</span>
                          {(() => {
                            const pred = typeof kundliReport.Predictions === "string" ? JSON.parse(kundliReport.Predictions) : kundliReport.Predictions;
                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2 hover:border-primary/20 transition-colors">
                                  <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-wide">
                                    <Sparkles className="h-4 w-4" /> Nature & Temperament
                                  </div>
                                  <p className="text-muted-foreground leading-relaxed">{pred.Nature}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2 hover:border-primary/20 transition-colors">
                                  <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-wide">
                                    <Award className="h-4 w-4" /> Education & Intellect
                                  </div>
                                  <p className="text-muted-foreground leading-relaxed">{pred.Education}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2 hover:border-primary/20 transition-colors">
                                  <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-wide">
                                    <Sun className="h-4 w-4" /> Health & Vitality
                                  </div>
                                  <p className="text-muted-foreground leading-relaxed">{pred.Health}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2 hover:border-primary/20 transition-colors">
                                  <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-wide">
                                    <MapPin className="h-4 w-4" /> Lifestyle & Habitat
                                  </div>
                                  <p className="text-muted-foreground leading-relaxed">{pred.LivingStyle}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2 hover:border-primary/20 transition-colors">
                                  <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-wide">
                                    <Award className="h-4 w-4" /> Wealth & Finance
                                  </div>
                                  <p className="text-muted-foreground leading-relaxed">{pred.Money}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2 hover:border-primary/20 transition-colors">
                                  <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-wide">
                                    <Sun className="h-4 w-4" /> Age & Longevity
                                  </div>
                                  <p className="text-muted-foreground leading-relaxed">{pred.Age}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 md:col-span-2 space-y-2 hover:border-primary/20 transition-colors">
                                  <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-wide">
                                    <Calendar className="h-4 w-4" /> Major Life Events & Milestones
                                  </div>
                                  <p className="text-muted-foreground leading-relaxed">{pred.BigEvents}</p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="glass-card h-80 rounded-2xl flex flex-col items-center justify-center text-center p-6 border-dashed">
                      <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="font-bold text-lg">No Chart Calculated</h3>
                      <p className="text-xs text-muted-foreground max-w-xs mt-1">
                        Input birth parameters in the generator configuration form and press calculate to visualize the Lagna chart details.
                      </p>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: MATCHMAKING */}
          {activeTab === "matchmaking" && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h2 className="text-3xl font-extrabold text-foreground">Kundli Matchmaking (Guna Milan)</h2>
                <p className="text-sm text-muted-foreground">Check compatibility coordinates between profiles stored in the vault.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Matchmaking controls */}
                <div className="glass-card p-6 rounded-2xl space-y-4 md:col-span-1 h-fit">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">First Profile (Bride)</label>
                    <select 
                      value={matchPrimary} onChange={(e) => setMatchPrimary(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm outline-none"
                    >
                      <option value="">Select Profile</option>
                      {familyMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.relationType})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Second Profile (Groom)</label>
                    <select 
                      value={matchSecondary} onChange={(e) => setMatchSecondary(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm outline-none"
                    >
                      <option value="">Select Profile</option>
                      {familyMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.relationType})</option>
                      ))}
                    </select>
                  </div>

                  <button 
                    onClick={handleRunMatchmaking}
                    className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-1"
                  >
                    <Heart className="h-4 w-4" /> Compare Compatibility Matrix
                  </button>
                </div>

                {/* Matchmaking Output Report */}
                <div className="md:col-span-2">
                  {matchmakingResult ? (
                    <div className="glass-card p-6 rounded-2xl space-y-6">
                      
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
                        <div>
                          <h3 className="text-xl font-bold">Compatibility Report</h3>
                          <p className="text-xs text-muted-foreground">Vedic calculations for Guna Milan (36 Points)</p>
                        </div>
                        <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl text-center">
                          <span className="text-[10px] text-primary block uppercase font-bold">Milan Score</span>
                          <span className="text-2xl font-black text-primary">{matchmakingResult.GunaMilanScore} / 36</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Compatibility Breakdown</h4>
                          <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                            <span className="text-xs text-muted-foreground">Overall compatibility percentage</span>
                            <h5 className="text-4xl font-extrabold text-foreground mt-2">{matchmakingResult.CompatibilityScore}%</h5>
                          </div>

                          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                            <span className="text-xs text-primary font-bold block">Manglik Compatibility</span>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>• Bride is Manglik: <span className="font-semibold text-foreground">{JSON.parse(matchmakingResult.ManglikStatus).primaryIsManglik ? "Yes" : "No"}</span></p>
                              <p>• Groom is Manglik: <span className="font-semibold text-foreground">{JSON.parse(matchmakingResult.ManglikStatus).secondaryIsManglik ? "Yes" : "No"}</span></p>
                              <p>• Compatibity Status: <span className={`font-bold ${JSON.parse(matchmakingResult.ManglikStatus).isCompatible ? "text-green-400" : "text-yellow-400"}`}>{JSON.parse(matchmakingResult.ManglikStatus).isCompatible ? "Favorable (Matched)" : "Requires Remedies"}</span></p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Dosha Analysis & Remedies</h4>
                          
                          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>• Nadi Dosha: <span className={`font-semibold ${JSON.parse(matchmakingResult.DoshaAnalysis).nadiDosha ? "text-red-400" : "text-green-400"}`}>{JSON.parse(matchmakingResult.DoshaAnalysis).nadiDosha ? "Detected" : "None"}</span></p>
                              <p>• Bhakoot Dosha: <span className={`font-semibold ${JSON.parse(matchmakingResult.DoshaAnalysis).bhakootDosha ? "text-red-400" : "text-green-400"}`}>{JSON.parse(matchmakingResult.DoshaAnalysis).bhakootDosha ? "Detected" : "None"}</span></p>
                            </div>
                          </div>

                          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                            <span className="text-xs text-primary font-bold block">Recommendations</span>
                            <p className="text-xs text-muted-foreground leading-relaxed">{matchmakingResult.Recommendations}</p>
                            <p className="text-[11px] text-yellow-400 mt-2">Remedies: {JSON.parse(matchmakingResult.DoshaAnalysis).remedyText}</p>
                          </div>
                        </div>

                      </div>

                    </div>
                  ) : (
                    <div className="glass-card h-80 rounded-2xl flex flex-col items-center justify-center text-center p-6 border-dashed">
                      <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="font-bold text-lg">No Matching Calculated</h3>
                      <p className="text-xs text-muted-foreground max-w-xs mt-1">
                        Select two family profiles from the lists and press the compare button to calculate Vedic matching.
                      </p>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 5: MUHURAT PLANNER */}
          {activeTab === "planner" && (
            <div className="space-y-8 animate-fadeIn">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Submodule A: Muhurat Planner */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-foreground">Life Events & Muhurat Planner</h2>
                    <p className="text-xs text-muted-foreground">Calculate auspicious dates and timeframes for key events.</p>
                  </div>

                  <div className="glass-card p-6 rounded-2xl space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Event Type</label>
                      <select 
                        value={muhuratEvent} onChange={(e) => setMuhuratEvent(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm outline-none"
                      >
                        <option value="Marriage">Marriage Ceremony</option>
                        <option value="Housewarming">Griha Pravesh (Housewarming)</option>
                        <option value="BusinessLaunch">Business Launch</option>
                        <option value="PropertyPurchase">Property Purchase</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">Start Date</label>
                        <input 
                          type="date" value={muhuratStart} onChange={(e) => setMuhuratStart(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">End Date</label>
                        <input 
                          type="date" value={muhuratEnd} onChange={(e) => setMuhuratEnd(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm outline-none"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={handlePlanMuhurat}
                      className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-1"
                    >
                      <Calendar className="h-4 w-4" /> Calculate Auspicious Windows
                    </button>
                  </div>

                  {muhuratReport.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Recommended Timings</h4>
                      {muhuratReport.map((m, idx) => (
                        <div key={idx} className="glass-card p-4 rounded-xl flex justify-between items-center">
                          <div>
                            <span className="text-xs font-bold text-foreground block">{m.date} @ {m.timeSlot}</span>
                            <span className="text-[11px] text-muted-foreground block mt-1">{m.explanation}</span>
                          </div>
                          <div className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg text-center">
                            <span className="text-[10px] text-primary block uppercase">Score</span>
                            <span className="font-bold text-sm text-primary">{m.score}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submodule B: Baby Naming & Planning */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-foreground">Baby Name & Planning Console</h2>
                    <p className="text-xs text-muted-foreground">Generate baby names based on birth charts or analyze target date ranges.</p>
                  </div>

                  <div className="glass-card p-6 rounded-2xl space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">Target Expected Date</label>
                        <input 
                          type="date" value={babyDob} onChange={(e) => setBabyDob(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">Category</label>
                        <select 
                          value={babyNamesCategory} onChange={(e) => setBabyNamesCategory(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm outline-none"
                        >
                          <option value="Sanskrit">Traditional Sanskrit</option>
                          <option value="Modern">Modern Cosmic</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Gender Preference</label>
                      <select 
                        value={babyGender} onChange={(e) => setBabyGender(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm outline-none"
                      >
                        <option value="Male">Boy Names</option>
                        <option value="Female">Girl Names</option>
                      </select>
                    </div>

                    <button 
                      onClick={handleGenerateBabyNames}
                      className="w-full bg-secondary hover:bg-secondary/95 text-secondary-foreground font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-1"
                    >
                      <Sparkles className="h-4 w-4" /> Generate Astrological Names
                    </button>
                  </div>

                  {generatedNames.length > 0 && (
                    <div className="glass-card p-6 rounded-2xl space-y-4">
                      
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-secondary">Auspicious Letters & Names</h4>
                        <div className="flex flex-wrap gap-2">
                          {generatedNames.map(name => (
                            <span key={name} className="bg-secondary/10 border border-secondary/20 px-3 py-1 rounded-full text-xs font-semibold text-secondary">
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {babyPlanResult && (
                        <div className="text-xs space-y-2 border-t border-white/5 pt-4">
                          <p>• Expected Rashi: <span className="font-semibold text-foreground">{babyPlanResult.expectedRashi}</span></p>
                          <p>• Expected Nakshatra: <span className="font-semibold text-foreground">{babyPlanResult.expectedNakshatra}</span></p>
                          <p className="text-muted-foreground leading-relaxed">Analysis: {babyPlanResult.astrologyAnalysis}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 6: AI ASTROLOGY ASSISTANT */}
          {activeTab === "ai" && (
            <div className="space-y-8 animate-fadeIn h-[calc(100vh-130px)] flex flex-col">
              
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-extrabold text-foreground">AI Astrology Assistant</h2>
                  <p className="text-sm text-muted-foreground">ChatGPT-style Vedic assistant capable of analyzing family vault charts.</p>
                </div>

                {/* AI Context member selection */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-sm">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Context Member:</span>
                  <select 
                    value={aiSelectedMember} 
                    onChange={(e) => setAiSelectedMember(e.target.value)}
                    className="bg-transparent text-foreground border-none outline-none text-xs cursor-pointer"
                  >
                    <option value="">Choose Profile</option>
                    {familyMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.relationType})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chat conversations layout */}
              <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-6 overflow-y-auto space-y-4 flex flex-col justify-end">
                <div className="space-y-4 overflow-y-auto max-h-[400px]">
                  {aiConversation.map((chat, idx) => (
                    <div 
                      key={idx} 
                      className={`flex flex-col max-w-[80%] p-4 rounded-2xl ${chat.sender === "user" ? "bg-primary text-primary-foreground self-end rounded-br-none ml-auto" : "glass-card text-foreground self-start rounded-bl-none mr-auto"}`}
                    >
                      <p className="text-sm leading-relaxed">{chat.text}</p>
                      {chat.context && (
                        <span className="text-[10px] text-muted-foreground/60 block mt-2">Context applied: {chat.context}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Input Console */}
              <form onSubmit={handleAiChat} className="flex gap-3">
                
                {/* Voice Input Trigger (Simulated) */}
                <button 
                  type="button"
                  onClick={() => {
                    setIsListening(!isListening);
                    if(!isListening) {
                      setAiMessage("Which family member is under Sade Sati?");
                    }
                  }}
                  className={`p-3 border rounded-xl flex items-center justify-center transition-colors ${isListening ? "bg-red-500/20 border-red-500 animate-pulse text-red-500" : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"}`}
                  title="Voice input speech simulation"
                >
                  <Mic className="h-5 w-5" />
                </button>

                <input 
                  type="text" value={aiMessage} onChange={(e) => setAiMessage(e.target.value)}
                  placeholder="Ask about Sade Sati, Manglik status, or compare profiles..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm outline-none focus:border-primary"
                />

                <button 
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3.5 rounded-xl text-sm transition-transform active:scale-95"
                >
                  Send Query
                </button>
              </form>

            </div>
          )}

          {/* TAB 7: CONSULTATION MARKETPLACE */}
          {activeTab === "marketplace" && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h2 className="text-3xl font-extrabold text-foreground">Consultation Marketplace</h2>
                <p className="text-sm text-muted-foreground">Book appointments for live chat, video, or audio consultations with verified astrologers.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Astrologers Directory */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Available Astrologers</h3>
                  {astrologers.map(a => (
                    <div key={a.id} className="glass-card p-6 rounded-2xl flex flex-col md:flex-row gap-6 border-white/5 hover:border-white/10 transition-colors">
                      <img src={a.photoUrl} className="h-16 w-16 bg-white/10 rounded-xl border border-white/20 self-start" alt="avatar" />
                      <div className="flex-1 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xl font-bold">{a.fullName}</h4>
                            <p className="text-xs text-primary font-semibold">{a.experienceYears} Years Exp • Specialties: {a.specialties.join(", ")}</p>
                          </div>
                          <span className="text-lg font-bold text-foreground">${a.hourlyRate} / hr</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{a.bio}</p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-yellow-400 font-bold">★ {a.rating} rating</span>
                          <button 
                            onClick={() => setSelectedAstrologer(a)}
                            className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl text-[11px]"
                          >
                            Book Session
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bookings Form & Schedule Lists */}
                <div className="space-y-6 md:col-span-1">
                  
                  {selectedAstrologer && (
                    <div className="glass-card p-6 rounded-2xl space-y-4 border-primary/20 animate-fadeIn">
                      <h3 className="font-bold text-sm text-primary">Scheduling: {selectedAstrologer.fullName}</h3>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">Date</label>
                        <input 
                          type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">Time Slot</label>
                        <input 
                          type="time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">Notes for Pandit ji</label>
                        <textarea 
                          value={bookingNotes} onChange={(e) => setBookingNotes(e.target.value)}
                          placeholder="e.g. Focus on career query"
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSelectedAstrologer(null)}
                          className="flex-1 bg-white/5 hover:bg-white/10 text-xs py-2 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleBookConsultation}
                          className="flex-1 bg-primary text-primary-foreground font-bold text-xs py-2 rounded-lg"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Upcoming Sessions</h3>
                    {appointments.map(a => (
                      <div key={a.id} className="glass-card p-4 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-foreground">{a.astrologerName}</span>
                          <span className="bg-primary/10 border border-primary/20 px-2 py-0.5 rounded text-primary text-[10px]">{a.status}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">Time: {a.scheduledAt.replace("T", " ").replace("Z", "")}</p>
                        <a 
                          href={a.meetingUrl} target="_blank" rel="noopener noreferrer"
                          className="text-[10px] text-secondary font-bold hover:underline flex items-center gap-0.5"
                        >
                          Join Jitsi Call <ArrowUpRight className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 8: ADMIN CONSOLE */}
          {activeTab === "admin" && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h2 className="text-3xl font-extrabold text-foreground">Admin Console & Settings</h2>
                <p className="text-sm text-muted-foreground">Operational translation matrices console and platform statistics logs.</p>
              </div>

              {/* Stats Widgets */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-4 rounded-xl">
                  <span className="text-[10px] text-muted-foreground block uppercase">Total platform Users</span>
                  <span className="text-2xl font-black text-foreground">{metrics.totalUsers}</span>
                </div>
                <div className="glass-card p-4 rounded-xl">
                  <span className="text-[10px] text-muted-foreground block uppercase">Approved Astrologers</span>
                  <span className="text-2xl font-black text-foreground">{metrics.totalAstrologers}</span>
                </div>
                <div className="glass-card p-4 rounded-xl">
                  <span className="text-[10px] text-muted-foreground block uppercase">Total Vault Profiles</span>
                  <span className="text-2xl font-black text-foreground">{metrics.totalFamilyProfiles}</span>
                </div>
                <div className="glass-card p-4 rounded-xl">
                  <span className="text-[10px] text-muted-foreground block uppercase">Platform Revenue</span>
                  <span className="text-2xl font-black text-green-400">${metrics.totalRevenue}</span>
                </div>
              </div>

              {/* Submodule A: Translations Console */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="glass-card p-6 rounded-2xl space-y-4">
                  <h3 className="font-bold text-lg text-primary">Dynamic Translations Console</h3>
                  <p className="text-xs text-muted-foreground">Edit system lookup keys for multilingual consoles.</p>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Translation Key</label>
                      <input 
                        type="text" placeholder="e.g. home_title" value={newTransKey} onChange={(e) => setNewTransKey(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">English Value</label>
                      <input 
                        type="text" placeholder="e.g. Discover Your Cosmic Blueprint" value={newTransValEn} onChange={(e) => setNewTransValEn(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Hindi Value (Optional)</label>
                      <input 
                        type="text" placeholder="e.g. अपने ब्रह्मांडीय खाके की खोज करें" value={newTransValHi} onChange={(e) => setNewTransValHi(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs outline-none"
                      />
                    </div>
                    <button 
                      onClick={handleAddTranslation}
                      className="w-full bg-primary text-primary-foreground font-bold py-2 rounded-lg text-xs"
                    >
                      Update Translation Keys
                    </button>
                  </div>
                </div>

                {/* Translation lookup list */}
                <div className="glass-card p-6 rounded-2xl space-y-4">
                  <h3 className="font-bold text-sm text-foreground">Current Dictionary Keys</h3>
                  <div className="h-64 overflow-y-auto space-y-2 text-xs pr-2">
                    {translationsList.map((t, idx) => (
                      <div key={idx} className="p-2.5 bg-white/5 border border-white/10 rounded-lg flex justify-between items-start">
                        <div>
                          <span className="font-bold text-primary text-[10px] block uppercase">{t.languageCode}</span>
                          <span className="font-semibold">{t.key}</span>
                          <p className="text-muted-foreground text-[11px] mt-0.5">{t.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 9: UPGRADE PLANS */}
          {activeTab === "upgrade" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="text-center max-w-xl mx-auto space-y-3">
                <span className="text-xs font-bold text-primary tracking-widest uppercase">Pricing Models</span>
                <h2 className="text-4xl font-black text-foreground">Flexible Subscriptions for Cosmic Alignment</h2>
                <p className="text-sm text-muted-foreground">Choose a plan that fits your personal and professional Vedic practices.</p>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                
                {/* Free Plan */}
                <div className="glass-card p-6 rounded-3xl space-y-6 flex flex-col justify-between border-white/5 hover:border-white/10 transition-colors">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xl font-bold">Free Plan</h4>
                      <p className="text-xs text-muted-foreground mt-1">Core calculation widgets</p>
                    </div>
                    <div className="text-3xl font-extrabold">$0 <span className="text-xs text-muted-foreground">/ month</span></div>
                    <ul className="text-xs text-muted-foreground space-y-2.5">
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Stored Vault: Max 3 Profiles</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Interactive SVG Birth Chart</li>
                      <li className="flex items-center gap-2 text-red-400/60"><Check className="h-4 w-4 text-red-500/60" /> No AI Assistant features</li>
                    </ul>
                  </div>
                  <button 
                    disabled={subscription.planType === "Free"}
                    className="w-full bg-white/5 hover:bg-white/10 disabled:opacity-50 text-foreground font-bold py-2.5 rounded-xl text-xs"
                  >
                    {subscription.planType === "Free" ? "Current Plan" : "Downgrade"}
                  </button>
                </div>

                {/* Premium Plan */}
                <div className="glass-card p-6 rounded-3xl space-y-6 flex flex-col justify-between border-primary/40 bg-primary/5 relative">
                  <span className="absolute -top-3 right-4 bg-primary text-primary-foreground font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">Popular</span>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xl font-bold">Premium Plan</h4>
                      <p className="text-xs text-muted-foreground mt-1">Unlimited vaults & AI Assistant</p>
                    </div>
                    <div className="text-3xl font-extrabold">$19.99 <span className="text-xs text-muted-foreground">/ month</span></div>
                    <ul className="text-xs text-muted-foreground space-y-2.5">
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Stored Vault: Unlimited Profiles</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Advanced Vimshottari Dasha analysis</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Speech-enabled AI Assistant</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> 10% Consultation Discounts</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => { setSelectedUpgradePlan("Premium"); setShowBillingModal(true); }}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 rounded-xl text-xs transition-transform active:scale-95"
                  >
                    {subscription.planType === "Premium" ? "Current Plan" : "Upgrade Premium"}
                  </button>
                </div>

                {/* Professional Plan */}
                <div className="glass-card p-6 rounded-3xl space-y-6 flex flex-col justify-between border-white/5 hover:border-white/10 transition-colors">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xl font-bold">Professional</h4>
                      <p className="text-xs text-muted-foreground mt-1">For practicing Astrologers</p>
                    </div>
                    <div className="text-3xl font-extrabold">$49.99 <span className="text-xs text-muted-foreground">/ month</span></div>
                    <ul className="text-xs text-muted-foreground space-y-2.5">
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Everything in Premium plan</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Custom branding on PDF reports</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Consultation Marketplace Listing</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => { setSelectedUpgradePlan("Professional"); setShowBillingModal(true); }}
                    className="w-full bg-white/5 hover:bg-white/10 text-foreground font-bold py-2.5 rounded-xl text-xs transition-transform active:scale-95"
                  >
                    Upgrade Professional
                  </button>
                </div>

              </div>

            </div>
          )}

        </main>

      </div>

      {/* Dynamic Simulated Stripe Modal */}
      {showBillingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="glass-card w-full max-w-md p-6 rounded-3xl space-y-6 border-primary/20 animate-fadeIn">
            
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-foreground">Secure Stripe Checkout</h3>
              <p className="text-xs text-muted-foreground">Upgrading subscription plan to {selectedUpgradePlan}</p>
            </div>

            {/* Credit Card Input mock */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Card Number</label>
                <input 
                  type="text" placeholder="4242 4242 4242 4242" disabled
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-foreground outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Expiry Date</label>
                  <input type="text" placeholder="12/29" disabled className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">CVC</label>
                  <input type="text" placeholder="123" disabled className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm outline-none" />
                </div>
              </div>
            </div>

            {/* Confirm button */}
            <div className="flex gap-3 pt-4 border-t border-white/5">
              <button 
                onClick={() => setShowBillingModal(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-xs py-3 rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleUpgradeSubscription(selectedUpgradePlan)}
                className="flex-1 bg-primary text-primary-foreground font-bold text-xs py-3 rounded-xl"
              >
                Simulate Payment
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
