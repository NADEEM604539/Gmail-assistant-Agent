import Link from "next/link";
import { useState, useEffect } from "react";
import Analytics from "../analytics/page";
import {
    ArrowRight,
    Bot,
    ChevronRight,
    CircleCheck,
    Clock3,
    Plus,
    Send,
    Inbox,
    Mail,
    MessageSquareText,
    PenSquare,
    Sparkles,
    Database,
    Star,
    CircleUserRound,
    Search,
    Signature,
    Languages,
    CalendarClock,
    ShieldCheck,
} from "lucide-react";
import MessagesCard from "./MessageCard";
import PreferenceCard from "./PreferenceCard";

export const preferences = [
    {
        id: 1,
        title: "Reply Tone",
        value: "Professional & Friendly",
        description: "All replies should be polite and professional.",
        icon: MessageSquareText,
        color: "#4285F4",
    },
    {
        id: 2,
        title: "Email Length",
        value: "Medium",
        description: "Keep replies concise but informative.",
        icon: PenSquare,
        color: "#34A853",
    },
    {
        id: 3,
        title: "Signature",
        value: "Regards,\nNadeem Mushtaq",
        description: "Automatically append to every email.",
        icon: Signature,
        color: "#FBBC05",
    },
    {
        id: 4,
        title: "Language",
        value: "English",
        description: "Default language for composing emails.",
        icon: Languages,
        color: "#A142F4",
    },
    {
        id: 5,
        title: "Meeting Replies",
        value: "Suggest Afternoon",
        description: "Recommend afternoon time slots by default.",
        icon: CalendarClock,
        color: "#00ACC1",
    },
    {
        id: 6,
        title: "Safety",
        value: "Ask Before Sending",
        description: "Require confirmation before sending emails.",
        icon: ShieldCheck,
        color: "#EA4335",
    },
];
const iconMap = {
    database: Database,
    mail: Mail,
    send: Send,
};

export default function Home({ user }) {
    const userName = user?.name || "there";
    const userEmail = user?.email || "demo@gmail.com"
    const [sections, setSections] = useState([]);
    const [stats, setStats] = useState([]);
    const [loadingSections, setLoadingSections] = useState(true);

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                const token = localStorage.getItem("access_token");

                if (!token) {
                    throw new Error("No access token found");
                }

                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stats/dashboard/gmail`,
                    {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!res.ok) {
                    throw new Error("Failed to fetch dashboard stats");
                }

                const data = await res.json();

                console.log(data);

                setStats(data.stats);

            } catch (error) {
                console.error(error);
            }
        };

        fetchDashboardStats();
    }, []);



    useEffect(() => {
        const fetchSections = async () => {
            try {
                const token = localStorage.getItem("access_token");

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/gmail/card`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch sections");
                }

                const data = await response.json();
                console.log(data)

                // backend returns { sections: [...] }
                setSections(data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingSections(false);
            }
        };

        fetchSections();
    }, []);


    return (
        <main className="min-h-screen bg-[#F6F8FC] px-4 py-4 text-[#202124] sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <section className="mx-auto max-w-[1400px] space-y-5">
                <div className="mb-6 flex flex-col gap-5 rounded-[28px] border border-[#E8EAED] bg-gradient-to-r from-white via-[#FAFBFF] to-[#F4F8FF] px-6 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">

                    {/* Left */}
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-[#E8F0FE] px-3.5 py-1.5 text-xs font-medium text-[#1A73E8]">
                            <div className="h-2 w-2 rounded-full bg-[#34A853]" />
                            Gmail Connected
                        </div>

                        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#202124] lg:text-4xl">
                            Welcome back, {userName} 👋
                        </h1>

                        <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#5F6368]">
                            Manage your Gmail with AI. Search emails, generate replies,
                            summarize conversations and stay organized.
                        </p>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-3 rounded-2xl border border-[#E8EAED] bg-white px-4 py-3 shadow-sm">

                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F0FE]">
                            <CircleUserRound
                                size={26}
                                className="text-[#4285F4]"
                            />
                        </div>

                        <div>
                            <p className="text-xs text-[#5F6368]">
                                Signed in as
                            </p>

                            <p className="text-[15px] font-semibold text-[#202124]">
                                {userName}
                            </p>

                            <p className="max-w-[220px] truncate text-xs text-[#5F6368]">
                                {user?.email}
                            </p>
                        </div>

                    </div>

                </div>
                {/* Main Action Cards */}

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

                    {/* Inbox */}
                    <Link
                        href="/inbox"
                        className="group rounded-3xl border border-[#E8EAED] bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#4285F4] hover:shadow-lg"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F0FE]">
                                <Inbox className="text-[#4285F4]" size={20} />
                            </div>

                            <ArrowRight
                                size={16}
                                className="text-[#9AA0A6] transition group-hover:translate-x-1"
                            />
                        </div>

                        <h3 className="mt-3 text-[17px] font-semibold text-[#202124]">
                            Inbox
                        </h3>

                        <p className="mt-0.5 text-[13px] text-[#5F6368]">
                            View latest emails
                        </p>
                    </Link>

                    {/* Sent */}
                    <Link
                        href="/sent"
                        className="group rounded-3xl border border-[#E8EAED] bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#34A853] hover:shadow-lg"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF7EE]">
                                <Send className="text-[#34A853]" size={20} />
                            </div>

                            <ArrowRight
                                size={16}
                                className="text-[#9AA0A6] transition group-hover:translate-x-1"
                            />
                        </div>

                        <h3 className="mt-3 text-[17px] font-semibold text-[#202124]">
                            Sent
                        </h3>

                        <p className="mt-0.5 text-[13px] text-[#5F6368]">
                            Recently delivered
                        </p>
                    </Link>

                    {/* Drafts */}
                    <Link
                        href="/drafts"
                        className="group rounded-3xl border border-[#E8EAED] bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#FBBC05] hover:shadow-lg"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF8E1]">
                                <PenSquare className="text-[#FBBC05]" size={20} />
                            </div>

                            <ArrowRight
                                size={16}
                                className="text-[#9AA0A6] transition group-hover:translate-x-1"
                            />
                        </div>

                        <h3 className="mt-3 text-[17px] font-semibold text-[#202124]">
                            Drafts
                        </h3>

                        <p className="mt-0.5 text-[13px] text-[#5F6368]">
                            Continue writing
                        </p>
                    </Link>

                    {/* Chat */}
                    <Link
                        href="/chat"
                        className="group rounded-3xl bg-[#4285F4] p-4 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:bg-[#1A73E8] hover:shadow-xl"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                                <Bot size={20} />
                            </div>

                            <ArrowRight
                                size={16}
                                className="transition group-hover:translate-x-1"
                            />
                        </div>

                        <h3 className="mt-3 text-[17px] font-semibold">
                            Chat with AI
                        </h3>

                        <p className="mt-0.5 text-[13px] text-blue-100">
                            Search & draft emails
                        </p>
                    </Link>

                </div>

                {/* Small Stats */}

                <div className="mt-6 flex flex-wrap items-center gap-3">

                    {stats.map((stat) => {

                        const Icon = iconMap[stat.icon];

                        return (
                            <div
                                key={stat.id}
                                className="flex items-center gap-2 rounded-full border border-[#E8EAED] bg-white px-4 py-2 shadow-sm transition hover:shadow-md"
                            >

                                {Icon && (
                                    <Icon
                                        size={16}
                                        style={{
                                            color: stat.color
                                        }}
                                    />
                                )}

                                <span className="font-semibold text-[#202124]">
                                    {stat.value}
                                </span>

                                <span className="text-sm text-[#5F6368]">
                                    {stat.title}
                                </span>

                            </div>
                        );
                    })}

                </div>



                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {sections.map((section) => (
                        <MessagesCard key={section.key} section={section} />
                    ))}
                </div>

                <Analytics />

            </section>
        </main>
    );
}






