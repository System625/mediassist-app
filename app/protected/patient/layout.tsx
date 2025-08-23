"use client";

import { Button } from "@/components/ui/button";
import ChatComponent from "@/components/ui/chatComponent";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EmergencyComponent from "@/components/ui/emergencyComponent";
import { useAuthContext } from "@/context/AuthContext";
import { auth, db } from "@/firebase/config";
import { useLogoutModal } from "@/components/ui/logout-modal";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import {
  Bell,
  CircleUserRound,
  DoorClosed,
  DoorOpen,
  Hospital,
  Menu,
  Phone,
  SettingsIcon,
  Tablets,
  Video,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface UserData {
  email: string;
  call: string;
}

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [email, setEmail] = useState<string>("");
  const [callId, setCallId] = useState<string | null>(null);
  const pathname = usePathname();
  const { user, role } = useAuthContext();
  const uid = user?.uid;
  const router = useRouter();
  const { openModal, LogoutModal } = useLogoutModal();

  useEffect(() => {
    if (!uid) return;

    const userRef = doc(db, "users", uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      const userData = doc.data() as UserData | undefined;
      if (userData) {
        setCallId(userData.call || null);
      }
    });

    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    const getEmail = async () => {
      const fetchedEmail = await fetchEmail();
      if (fetchedEmail) {
        setEmail(fetchedEmail);
      }
    };

    const fetchEmail = async (): Promise<string | undefined> => {
      if (!uid) return undefined;
      const userRef = doc(db, "users", uid);

      try {
        // Get the current user document
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data() as UserData | undefined;
        return userData?.email;
      } catch (error) {
        console.error("Error fetching email:", error);
        return undefined;
      }
    };

    getEmail();
  }, [uid]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (role === "doctor") {
      router.push("/protected/doctor");
    }

    const fetchData = async () => {
      if (!user?.uid) return;
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const isOnboarded = userData.onboarded || false;

        if (!isOnboarded) {
          router.push("/protected/patient-onboarding");
        }
      }
    };

    fetchData();
  }, [user, role]);

  function formatDate(date: Date) {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long" as const,
      year: "numeric" as const,
      month: "long" as const,
      day: "numeric" as const,
    };
    return new Intl.DateTimeFormat("en-US", options).format(date);
  }

  const date = formatDate(new Date());

  const isActiveLink = (path: string) => pathname === path;

  return (
    <div className="flex flex-1 w-full h-screen overflow-hidden">
      <input type="checkbox" id="sidebar-toggle" className="hidden peer" />
      <nav className="fixed inset-y-0 left-0 z-50 w-60 -translate-x-full peer-checked:translate-x-0 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shrink-0 flex flex-col items-start justify-start bg-white border-r border-gray-200 p-4 h-screen overflow-y-auto shadow-sm">
        <Link
          href="/protected/patient"
          className="flex justify-center w-full mb-6"
          prefetch={false}
        >
          <span className="text-lg font-bold text-black text-center">
            MediAssist
          </span>
        </Link>

        <div className="flex flex-col w-full space-y-1 mb-auto">
          <Link
            href="/protected/patient"
            className={`flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer ${isActiveLink("/protected/patient")
              ? "bg-primary text-white shadow-md"
              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
            prefetch={false}
          >
            <Tablets className="mr-3 h-5 w-5" />
            Medications
          </Link>
          <Link
            href="/protected/patient/hospitals"
            className={`flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer ${isActiveLink("/protected/patient/hospitals")
              ? "bg-primary text-white shadow-md"
              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
            prefetch={false}
          >
            <Hospital className="mr-3 h-5 w-5" />
            Locate Hospitals
          </Link>
          <Link
            href={
              callId
                ? `/protected/patient/video-call?callId=${callId}`
                : "/protected/patient/video-call"
            }
            className={`flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer ${
              isActiveLink("/protected/patient/video-call")
                ? "bg-primary text-white shadow-md"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            } ${callId ? "animate-pulse border-2 border-red-200" : ""}`}
            prefetch={false}
          >
            {callId ? (
              <Phone className="mr-3 h-5 w-5 text-red-500" />
            ) : (
              <Video className="mr-3 h-5 w-5" />
            )}
            {callId ? "Incoming Call" : "Virtual Meetings"}
            {callId && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                1
              </span>
            )}
          </Link>
        </div>

        <div className="w-full space-y-1 pt-4 border-t border-gray-200">
          <Link
            href="/protected/patient/settings"
            className={`flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer ${isActiveLink("/protected/patient/settings")
              ? "bg-primary text-white shadow-md"
              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
            prefetch={false}
          >
            <SettingsIcon className="mr-3 h-5 w-5" />
            Settings
          </Link>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 btn-gradient rounded-full flex items-center justify-center mr-3">
                  <CircleUserRound className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Profile</p>
                  <p
                    className="text-xs text-gray-500 overflow-hidden whitespace-nowrap text-ellipsis"
                    style={{ maxWidth: "120px" }}
                  >
                    {email.length > 18 ? `${email.substring(0, 18)}...` : email}
                  </p>
                </div>
              </div>
              <button
                className="flex items-center justify-center cursor-pointer p-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 group"
                onClick={openModal}
                title="Sign out"
              >
                <DoorClosed className="h-5 w-5 text-gray-600 group-hover:text-red-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </nav>
      <div className="flex flex-col w-full h-screen overflow-hidden">
        <header className="fixed ml-0 md:ml-60 top-0 left-0 right-0 z-10 flex h-16 items-center bg-white px-4 md:px-6 border-b border-[#E4E7EC]">
          <Link
            href="#"
            className="flex items-center gap-2 text-[#6C6C6C] text-xl font-semibold"
          >
            {date}
          </Link>
          <nav className="ml-auto flex items-center gap-2">
            <Link
              href="#"
              className="text-sm font-medium text-black rounded-full w-6 h-6 bg-[#D9D9D9] flex items-center justify-center"
              prefetch={false}
            >
              <Bell size={13} />
            </Link>
            <label
              htmlFor="sidebar-toggle"
              className="cursor-pointer md:hidden"
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-400">
                <Menu className="h-5 w-5" />
              </div>
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" className="rounded-full w-8 h-8">
                  <CircleUserRound className="w-full h-full" color="white" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/protected/patient/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/protected/patient/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={openModal}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </header>
        <div className="flex flex-1 pt-16 overflow-hidden">
          <div className="flex-1 overflow-y-auto">{children}</div>
          <EmergencyComponent />
          <ChatComponent />
        </div>
      </div>
      <LogoutModal />
    </div>
  );
}
