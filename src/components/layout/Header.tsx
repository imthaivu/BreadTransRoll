"use client";

import BackButton from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { NavigationList } from "@/constants";
import { useAuth } from "@/lib/auth/context";
import { translateRole } from "@/lib/auth/utils";
import MagicDoor from "@/modules/home/components/MagicDoor";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { FaFire, FaTicketAlt } from "react-icons/fa";
import { FiChevronDown, FiLayers } from "react-icons/fi";
import { useNewTicketNotification } from "@/hooks/useNewTicketNotification";
import { TicketNotification } from "@/components/ui/TicketNotification";

// Animation variants for dropdown
const MAX_VISIBLE_NAV_ITEMS = 0;

const DROPDOWN_VARIANTS = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut" as const,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: "easeIn" as const,
    },
  },
};

export default function Header() {
  const { profile, signOutApp, role, session, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [showMagicDoor, setShowMagicDoor] = useState(false);
  const pathname = usePathname();
  const avatarRef = useRef<HTMLDivElement>(null);
  const [avatarPosition, setAvatarPosition] = useState<{ x: number; y: number } | undefined>();

  const isStudent = role == "student";
  
  // Track new tickets for students
  const { hasNewTickets, ticketCount, showNotification, dismissNotification } = useNewTicketNotification();

  // Calculate avatar position for notification
  useEffect(() => {
    if (avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      setAvatarPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
  }, [profile?.avatarUrl, showNotification]);

  // Close mobile menu when pressing Escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
        }
        if (isMoreMenuOpen) {
          setIsMoreMenuOpen(false);
        }
        if (showMagicDoor) {
          setShowMagicDoor(false);
        }
      }
    };

    if (
      isMobileMenuOpen ||
      isMoreMenuOpen ||
      showMagicDoor
    ) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isMobileMenuOpen, isMoreMenuOpen, showMagicDoor]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMoreMenuOpen) {
        const target = event.target as Element;
        if (!target.closest(".more-features-dropdown")) {
          setIsMoreMenuOpen(false);
        }
      }
    };

    if (isMoreMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo onCloseMobileMenu={closeMobileMenu} />
          {session?.user?.role === "admin" && NavigationList?.admin[0] && (
            <Link
              href={NavigationList.admin[0].href}
              className={`inline-flex items-center gap-1 transition-all duration-200 px-3 py-1.5 rounded-lg ${
                pathname === NavigationList.admin[0].href
                  ? "text-primary  bg-primary/10 font-medium"
                  : "hover:text-primary hover: bg-primary/5"
              }`}
            >
              {NavigationList.admin[0].icon} {NavigationList.admin[0].label}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative md:hidden w-8 h-8" ref={avatarRef}>
            {profile?.streakCount && profile.streakCount > 0 && (
              <div
                className="absolute -top-3 -right-4 flex items-center gap-1 text-orange-500 font-semibold"
                title={`Chuỗi ${profile.streakCount} ngày!`}
              >
                <FaFire />
                <span>{profile.streakCount}</span>
              </div>
            )}

            {profile?.avatarUrl && (
              <Link href={"/profile"}>
                <div className="relative">
                  <Image
                    src={profile.avatarUrl ?? ""}
                    alt={profile.displayName ?? ""}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  {/* Ticket icon badge */}
                  {isStudent && hasNewTickets && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute -top-1 -left-1 bg-orange-500 rounded-full p-1 shadow-lg border-2 border-white"
                      title={`Có ${ticketCount} vé quay bánh mì`}
                    >
                      <FaTicketAlt className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </div>
              </Link>
            )}
          </div>

          {isStudent && (
            <div className="flex md:hidden items-center bg-blue-100 text-white text-sm md:text-base font-bold px-3 py-0.5 rounded-full h-10 ml-2">
              <span className="mr-1 text-gray-600">Có</span>
              <span className="text-black">{profile?.totalBanhRan || 0}</span>
              <Image
                src={
                  "https://magical-tulumba-581427.netlify.app/img-ui/dorayaki.png"
                }
                alt="Bánh mì"
                width={24}
                height={24}
                className="inline-block ml-1"
              />
            </div>
          )}

          {!loading && !session?.user && (
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowMagicDoor(true)}>Tham gia</Button>
            </div>
          )}

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center gap-2">
            <UserActions
              setShowMagicDoor={setShowMagicDoor}
            />
          </div>

          {/* Mobile Menu Button */}
          {/* <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-md transition-colors duration-200 text-foreground hover:text-primary hover:bg-border"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button> */}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {/* <MobileMenu
        isMobileMenuOpen={isMobileMenuOpen}
        closeMobileMenu={closeMobileMenu}
        setShowMagicDoor={setShowMagicDoor}
        setShowLogoutConfirm={setShowLogoutConfirm}
      /> */}

      {/* Magic Door Modal */}
      <MagicDoor
        isOpen={showMagicDoor}
        onClose={() => setShowMagicDoor(false)}
        onLogin={(studentId) => {
          setShowMagicDoor(false);
        }}
      />

      {/* Ticket Notification */}
      {isStudent && (
        <TicketNotification
          show={showNotification}
          onDismiss={dismissNotification}
          avatarPosition={avatarPosition}
        />
      )}
    </header>
  );
}

// Logo Component
interface LogoProps {
  onCloseMobileMenu?: () => void;
}

function Logo({ onCloseMobileMenu }: LogoProps) {
  const logoContent = (
    <>
      <Image
        src="https://magical-tulumba-581427.netlify.app/img-ui/icon.ico"
        alt="Bread Translation"
        width={32}
        height={32}
        className="rounded-lg"
      />
      <span className="inline-block max-w-[50vw] md:max-w-[200px] truncate text-xl md:text-3xl">
        BREADTRANS
      </span>
    </>
  );

  return (
    <BackButton
      className="font-bold text-lg tracking-tight text-primary inline-flex items-center gap-2"
      onClick={onCloseMobileMenu}
    >
      {logoContent}
    </BackButton>
  );
}

// Desktop Navigation Component
interface DesktopNavigationProps {
  isMoreMenuOpen: boolean;
  setIsMoreMenuOpen: (open: boolean) => void;
}

function DesktopNavigation({
  isMoreMenuOpen,
  setIsMoreMenuOpen,
}: DesktopNavigationProps) {
  const { role } = useAuth();
  const pathname = usePathname();

  const navigationList = getNavigationByRole();
  const isShowMoreFeatures = navigationList.length > MAX_VISIBLE_NAV_ITEMS;

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  function getNavigationByRole() {
    if (!role || role === "guest") {
      return NavigationList.public;
    }

    switch (role) {
      case "student":
        return [...NavigationList.public, ...NavigationList.student];
      case "teacher":
        return NavigationList.teacher;
      case "admin":
        return NavigationList.admin;
      default:
        return NavigationList.public;
    }
  }

  return (
    <nav className="hidden lg:flex items-center gap-2 text-sm md:text-base text-foreground">
      {navigationList.slice(0, MAX_VISIBLE_NAV_ITEMS).map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex items-center gap-1 transition-all duration-200 px-3 py-1.5 rounded-lg ${
              isActive
                ? "text-primary  bg-primary/10 font-medium"
                : "hover:text-primary hover: bg-primary/5"
            }`}
          >
            {item.icon} {item.label}
          </Link>
        );
      })}

      {/* More Features Dropdown - hiển thị cho tất cả trang */}
      {isClient && isShowMoreFeatures && (
        <div className="relative more-features-dropdown">
          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className={`inline-flex items-center gap-1 transition-all duration-200 px-3 py-1.5 rounded-lg ${
              isMoreMenuOpen
                ? "text-primary  bg-primary/10 font-medium"
                : "hover:text-primary hover: bg-primary/5"
            }`}
          >
            <FiLayers />
            Danh mục
            <FiChevronDown
              className={`transition-transform duration-200 ${
                isMoreMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isMoreMenuOpen && (
              <motion.div
                className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                variants={DROPDOWN_VARIANTS}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {navigationList.slice(MAX_VISIBLE_NAV_ITEMS).map((feature) => {
                  const isActive = pathname === feature.href;
                  return (
                    <Link
                      key={feature.href}
                      href={feature.href}
                      onClick={() => setIsMoreMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2 text-sm md:text-base transition-colors ${
                        isActive
                          ? "text-primary  bg-primary/10 font-medium"
                          : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                      }`}
                    >
                      {feature.icon}
                      {feature.label}
                    </Link>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </nav>
  );
}

// User Actions Component
interface UserActionsProps {
  setShowMagicDoor: (show: boolean) => void;
}

function UserActions({
  setShowMagicDoor,
}: UserActionsProps) {
  const { session, profile, loading, role } = useAuth();
  const isStudent = role == "student";
  const avatarRef = useRef<HTMLDivElement>(null);
  const [avatarPosition, setAvatarPosition] = useState<{ x: number; y: number } | undefined>();

  // Track new tickets for students
  const { hasNewTickets, ticketCount, showNotification, dismissNotification } = useNewTicketNotification();

  // Calculate avatar position for notification
  useEffect(() => {
    if (avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      setAvatarPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
  }, [profile?.avatarUrl, showNotification]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="w-8 h-8 bg-gray-300 rounded-full" />
        <div className="w-20 h-4 bg-gray-300 rounded" />
      </div>
    );
  }

  if (!session?.user) {
    return <></>;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Link
          href="/profile"
          className="flex items-center gap-2 text-sm md:text-base text-slate-700 hover:text-indigo-700"
        >
          {profile?.avatarUrl && (
            <div className="relative" ref={avatarRef}>
              <Image
                src={profile.avatarUrl ?? ""}
                alt={profile.displayName ?? ""}
                width={32}
                height={32}
                className="rounded-full"
              />
              {/* Ticket icon badge */}
              {isStudent && hasNewTickets && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="absolute -top-1 -left-1 bg-orange-500 rounded-full p-1 shadow-lg border-2 border-white"
                  title={`Có ${ticketCount} vé quay bánh mì`}
                >
                  <FaTicketAlt className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </div>
          )}

        <div className="flex flex-col leading-tight mr-2">
          <span className="truncate max-w-28">
            {(profile as { displayName?: string; email?: string })
              ?.displayName ??
              (profile as { displayName?: string; email?: string })?.email ??
              "Profile"}
          </span>

          <span className="truncate max-w-20 text-sm text-gray-500">
            {translateRole(role as string)}
          </span>
        </div>
      </Link>

      {isStudent && (
        <div className="hidden md:flex items-center bg-blue-100 text-white text-sm md:text-base font-bold px-3 py-0.5 rounded-full h-10">
          <span className="mr-1 text-gray-600">Có</span>
          <span className="text-black">{profile?.totalBanhRan || 0}</span>
          <Image
            src={
              "https://magical-tulumba-581427.netlify.app/img-ui/dorayaki.png"
            }
            alt="Bánh mì"
            width={24}
            height={24}
            className="inline-block ml-1"
          />
        </div>
      )}

      {profile?.streakCount && profile.streakCount > 0 && (
        <div
          className="flex items-center bg-yellow-100 text-red-400 text-sm md:text-base font-bold px-3 py-0.5 rounded-full h-10"
          title={`Chuỗi ${profile.streakCount} ngày!`}
        >
          <span>Streak:</span>
          <span className="ml-1">{profile.streakCount}</span>
          <FaFire />
        </div>
      )}

      {/* Logout button */}
      {/* <Button
        variant="primary"
        size="sm"
        onClick={() => setShowLogoutConfirm(true)}
        aria-label="Đăng xuất"
      >
        <FiLogOut />
        <span className="ml-1">Đăng xuất</span>
      </Button> */}
      </div>

      {/* Ticket Notification */}
      {isStudent && (
        <TicketNotification
          show={showNotification}
          onDismiss={dismissNotification}
          avatarPosition={avatarPosition}
        />
      )}
    </>
  );
}

// Mobile Menu Component
// interface MobileMenuProps {
//   isMobileMenuOpen: boolean;
//   closeMobileMenu: () => void;
//   setShowMagicDoor: (show: boolean) => void;
//   setShowLogoutConfirm: (show: boolean) => void;
// }

// function MobileMenu({
//   isMobileMenuOpen,
//   closeMobileMenu,
//   setShowMagicDoor,
//   setShowLogoutConfirm,
// }: MobileMenuProps) {
//   const { role, session, profile } = useAuth();
//   const pathname = usePathname();

//   const navigationList = getNavigationByRole();

//   function getNavigationByRole() {
//     if (!role || role === "guest") {
//       return NavigationList.public;
//     }

//     switch (role) {
//       case "student":
//         return [...NavigationList.public, ...NavigationList.student];
//       case "teacher":
//         return NavigationList.teacher;
//       case "admin":
//         return NavigationList.admin;
//       default:
//         return NavigationList.public;
//     }
//   }

//   return (
//     <AnimatePresence>
//       {isMobileMenuOpen && (
//         <>
//           {/* Backdrop Overlay */}
//           <div
//             className="fixed inset-0 z-30 md:hidden"
//             onClick={closeMobileMenu}
//           />

//           {/* Menu Content */}
//           <motion.div
//             className="fixed top-16 left-0 right-0 z-40 lg:hidden shadow-lg bg-white border-t border-border"
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -20 }}
//             transition={{ duration: 0.2, ease: "easeOut" }}
//           >
//             <div className="px-4 py-2 space-y-1">
//               {/* Navigation Links */}
//               {navigationList.map((item) => {
//                 const isActive = pathname === item.href;
//                 return (
//                   <Link
//                     key={item.href}
//                     href={item.href}
//                     onClick={closeMobileMenu}
//                     className={`flex items-center gap-3 px-3 py-2 text-sm md:text-base rounded-md transition-colors duration-200 ${
//                       isActive
//                         ? "text-primary  bg-primary/10 font-medium"
//                         : "text-foreground hover:text-primary hover:bg-border"
//                     }`}
//                   >
//                     {item.icon} {item.label}
//                   </Link>
//                 );
//               })}

//               {/* Divider */}
//               <div className="border-t border-border my-2"></div>

//               {/* User Actions */}
//               {!session?.user ? (
//                 <div className="space-y-2">
//                   <Button
//                     onClick={() => {
//                       setShowMagicDoor(true);
//                       closeMobileMenu();
//                     }}
//                     className="w-full justify-center"
//                   >
//                     Tham gia
//                   </Button>
//                 </div>
//               ) : (
//                 <div className="space-y-2">
//                   <Link
//                     href="/profile"
//                     onClick={closeMobileMenu}
//                     className="flex items-center gap-3 px-3 py-2 text-sm md:text-base text-foreground hover:text-primary hover:bg-border rounded-md transition-colors duration-200"
//                   >
//                     <FiUser />
//                     <span>
//                       {(profile as { displayName?: string; email?: string })
//                         ?.displayName ??
//                         (profile as { displayName?: string; email?: string })
//                           ?.email ??
//                         "Profile"}
//                     </span>

//                     {/* Role */}
//                     <span>- {translateRole(role as string)}</span>

//                     {/* Total bánh mì */}
//                     {role == "student" && (
//                       <div className="flex items-center bg-primary text-white text-sm md:text-base font-bold px-3 py-0.5 rounded-full h-10">
//                         <span className="mr-1 text-gray-600">Có</span>
//                         <span className="text-black">
//                           {profile?.totalBanhRan || 0}{" "}
//                         </span>
//                         <Image
//                           src={
//                             "https://magical-tulumba-581427.netlify.app/img-ui/dorayaki.png"
//                           }
//                           alt="Bánh mì"
//                           width={24}
//                           height={24}
//                           className="inline-block ml-1"
//                         />
//                       </div>
//                     )}

//                     {/* Streak Count */}
//                     {profile?.streakCount && profile.streakCount > 0 && (
//                       <div
//                         className="flex items-center gap-1 text-orange-500 font-semibold"
//                         title={`Chuỗi ${profile.streakCount} ngày!`}
//                       >
//                         <FaFire />
//                         <span>{profile.streakCount}</span>
//                       </div>
//                     )}
//                   </Link>

{
  /* <Button
  variant="outline"
  onClick={() => {
    setShowLogoutConfirm(true);
    closeMobileMenu();
  }}
  className="w-full justify-center mt-2"
>
  <FiLogOut /> <span className="ml-2">Đăng xuất</span>
</Button> */
}
//                 </div>
//               )}
//             </div>
//           </motion.div>
//         </>
//       )}
//     </AnimatePresence>
//   );
// }
