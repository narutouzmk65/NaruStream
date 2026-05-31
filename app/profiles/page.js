"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./profiles.module.css";
import { supabase } from "@/lib/supabase";

// Avatar styles avec DiceBear (style anime)
const AVATARS = [
  "https://api.dicebear.com/9.x/adventurer/svg?seed=naruto",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=sakura",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=sasuke",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=kakashi",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=hinata",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=minato",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=itachi",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=gaara",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=shikamaru",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=temari"
];

export default function ProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState([]);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfilePin, setNewProfilePin] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [isKid, setIsKid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinProfile, setPinProfile] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const pinInputRef = useRef(null);

  const fetchProfiles = async (userId) => {
    const { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId);
    setProfiles(data || []);
    setLoading(false);
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      fetchProfiles(user.id);

      // Check if user is admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      setIsAdmin(profile?.is_admin || false);
    };
    checkUser();
  }, [router]);

  const handleAddProfile = async (e) => {
    e.preventDefault();
    console.log("Adding profile...");
    console.log("Name:", newProfileName);
    console.log("User:", user);
    
    if (!newProfileName || !user) {
      alert("Nom et utilisateur requis !");
      return;
    }

    const { data, error } = await supabase.from("user_profiles").insert([
      {
        user_id: user.id,
        name: newProfileName,
        pin: newProfilePin || null,
        is_kid: isKid,
        avatar_id: selectedAvatar,
        avatar_url: AVATARS[selectedAvatar],
      },
    ]).select();

    console.log("Supabase response:", { data, error });

    if (error) {
      console.error("Error adding profile:", error);
      alert("Erreur lors de l'ajout du profil : " + error.message);
    } else {
      setShowAddProfile(false);
      setNewProfileName("");
      setNewProfilePin("");
      setSelectedAvatar(0);
      setIsKid(false);
      fetchProfiles(user.id);
    }
  };

  const handleSelectProfile = (profile) => {
    // Play sound
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3");
      audio.volume = 0.7;
      audio.play().catch(err => console.log("Audio play failed:", err));
    } catch (e) {
      console.log("Audio error:", e);
    }
    
    if (profile.pin) {
      setPinProfile(profile);
      setShowPinModal(true);
    } else {
      const profileJson = JSON.stringify(profile);
      sessionStorage.setItem("current_profile", profileJson);
      localStorage.setItem("current_profile", profileJson);
      setTimeout(() => {
        router.push("/");
      }, 500);
    }
  };

  useEffect(() => {
    if (showPinModal && pinInputRef.current) {
      pinInputRef.current.focus();
    }
  }, [showPinModal]);

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Only numbers
    if (value.length <= 4) {
      setPinInput(value);
      setPinError(false);
      if (value.length === 4 && pinProfile) {
        setTimeout(() => {
          if (value === pinProfile.pin) {
              // Play sound
              try {
                const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3");
                audio.volume = 0.7;
                audio.play().catch(err => console.log("Audio play failed:", err));
              } catch (e) {
                console.log("Audio error:", e);
              }
              const profileJson = JSON.stringify(pinProfile);
              sessionStorage.setItem("current_profile", profileJson);
              localStorage.setItem("current_profile", profileJson);
              setShowPinModal(false);
              setPinInput("");
              setTimeout(() => {
                router.push("/");
              }, 500);
            } else {
            setPinError(true);
            setPinInput("");
            setTimeout(() => {
              pinInputRef.current?.focus();
            }, 100);
          }
        }, 300);
      }
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      setPinInput(prev => prev.slice(0, -1));
      setPinError(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem("current_profile");
    router.push("/login");
  };

  const handleDeleteProfile = async (profile, e) => {
    e.stopPropagation(); // Prevent selecting the profile when deleting
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le profil "${profile.name}" ? Cette action est irréversible.`)) {
      const { error } = await supabase
        .from("user_profiles")
        .delete()
        .eq("id", profile.id);
      
      if (error) {
        alert("Erreur lors de la suppression du profil.");
        console.error(error);
      } else {
        // If the deleted profile was the current one, clear it from sessionStorage
        const currentProfileStr = sessionStorage.getItem("current_profile");
        if (currentProfileStr) {
          const currentProfile = JSON.parse(currentProfileStr);
          if (currentProfile.id === profile.id) {
            sessionStorage.removeItem("current_profile");
          }
        }
        fetchProfiles(user.id);
      }
    }
  };

  const getAvatarUrl = (profile) => {
    if (profile.avatar_url) return profile.avatar_url;
    if (profile.avatar_id !== undefined) return AVATARS[profile.avatar_id];
    return AVATARS[0];
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Chargement...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Qui est-ce ?</h1>
        <div className={styles.profilesGrid}>
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className={styles.profileCard}
              onClick={() => handleSelectProfile(profile)}
            >
              <div className={styles.profileAvatar}>
                <img src={getAvatarUrl(profile)} alt={profile.name} className={styles.avatarImg} />
              </div>
              <p className={styles.profileName}>{profile.name}</p>
              {profile.is_kid && <span className={styles.kidBadge}>Enfant</span>}
              <button
                className={styles.deleteProfileButton}
                onClick={(e) => handleDeleteProfile(profile, e)}
                title="Supprimer le profil"
              >
                🗑️
              </button>
            </div>
          ))}
          <div
            className={styles.profileCard}
            onClick={() => setShowAddProfile(true)}
          >
            <div className={styles.addProfileAvatar}>+</div>
            <p className={styles.profileName}>Ajouter un profil</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          {isAdmin && (
            <button 
              onClick={() => router.push("/admin")} 
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                color: 'white',
                background: 'linear-gradient(135deg, #00b4d8, #0077b6)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(0, 180, 216, 0.4)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 0 30px rgba(0, 180, 216, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 0 20px rgba(0, 180, 216, 0.4)';
              }}
            >
              🔧 Admin Dashboard
            </button>
          )}
          <button onClick={handleLogout} className={styles.logoutButton}>
            Se déconnecter
          </button>
        </div>
      </div>

      {showAddProfile && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Ajouter un profil</h2>
            <form onSubmit={handleAddProfile} className={styles.modalForm}>
              <input
                type="text"
                placeholder="Nom"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                className={styles.modalInput}
                required
              />
              
              {/* Avatar Selection */}
              <div className={styles.avatarSelection}>
                <h3>Choisissez un avatar :</h3>
                <div className={styles.avatarsGrid}>
                  {AVATARS.map((avatar, index) => (
                    <div
                      key={index}
                      className={`${styles.avatarOption} ${selectedAvatar === index ? styles.selectedAvatar : ""}`}
                      onClick={() => setSelectedAvatar(index)}
                    >
                      <img src={avatar} alt={`Avatar ${index}`} />
                    </div>
                  ))}
                </div>
              </div>
              
              <input
                type="password"
                placeholder="PIN à 4 chiffres (optionnel)"
                maxLength={4}
                value={newProfilePin}
                onChange={(e) => setNewProfilePin(e.target.value)}
                className={styles.modalInput}
              />
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={isKid}
                  onChange={(e) => setIsKid(e.target.checked)}
                />
                Profil Enfant
              </label>
              <div className={styles.modalButtons}>
                <button
                  type="button"
                  onClick={() => setShowAddProfile(false)}
                  className={styles.modalButtonSecondary}
                >
                  Annuler
                </button>
                <button type="submit" className={styles.modalButtonPrimary}>
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PIN Modal */}
      {showPinModal && pinProfile && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            {/* Show profile info */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
              <img 
                src={getAvatarUrl(pinProfile)} 
                alt={pinProfile.name} 
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '12px',
                  marginBottom: '1rem',
                  boxShadow: '0 0 30px rgba(229, 9, 20, 0.3)'
                }}
              />
              <h2 className={styles.modalTitle} style={{ marginBottom: '0.5rem' }}>
                {pinProfile.name}
              </h2>
              <p style={{ color: '#aaa', margin: 0, fontSize: '0.9rem' }}>
                Entrez votre PIN
              </p>
            </div>
            
            {pinError && (
              <p style={{ 
                color: '#ff3232', 
                marginBottom: '1.5rem', 
                fontSize: '1.1rem', 
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                ❌ PIN incorrect !
              </p>
            )}
            
            <div 
              className={styles.pinInputContainer}
              onClick={() => pinInputRef.current?.focus()}
            >
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`${styles.pinDigit} ${pinInput.length > i ? styles.pinDigitFilled : ''} ${pinError ? styles.pinDigitError : ''}`}>
                  {pinInput.length > i ? '●' : ''}
                </div>
              ))}
            </div>
            
            {/* Visible input that we style */}
            <input
              ref={pinInputRef}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pinInput}
              onChange={handlePinChange}
              onKeyDown={handleKeyDown}
              maxLength={4}
              autoFocus
              className={styles.pinHiddenInput}
            />
            
            <button
              type="button"
              onClick={() => {
                setShowPinModal(false);
                setPinInput("");
                setPinError(false);
              }}
              className={styles.modalButtonSecondary}
              style={{ marginTop: '2rem' }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
