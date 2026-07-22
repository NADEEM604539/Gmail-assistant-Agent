import Link from "next/link";
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


const sections = [
    {
        key: "drafts",
        title: "Last drafts",
        accent: "#F59E0B",
        icon: <PenSquare size={18} />,
        items: [
            {
                sender: "You",
                avatar: "https://ui-avatars.com/api/?name=You&background=F59E0B&color=fff",
                subject: "Draft: Project update for client",
                time: "10:12 AM",
            },
            {
                sender: "You",
                avatar: "https://ui-avatars.com/api/?name=You&background=F59E0B&color=fff",
                subject: "Reply to HR about interview schedule",
                time: "Yesterday",
            },
            {
                sender: "You",
                avatar: "https://ui-avatars.com/api/?name=You&background=F59E0B&color=fff",
                subject: "Draft: meeting summary for team",
                time: "Yesterday",
            },
            {
                sender: "You",
                avatar: "https://ui-avatars.com/api/?name=You&background=F59E0B&color=fff",
                subject: "Follow-up on invoice clarification",
                time: "2 days ago",
            },
            {
                sender: "You",
                avatar: "https://ui-avatars.com/api/?name=You&background=F59E0B&color=fff",
                subject: "Draft: onboarding email to new member",
                time: "2 days ago",
            },
        ],
    },
    {
        key: "received",
        title: "Last received",
        accent: "#4285F4",
        icon: <Inbox size={18} />,
        items: [
            {
                sender: "Google",
                avatar: "https://logo.clearbit.com/google.com",
                subject: "Security alert for your account",
                time: "10:30 AM",
            },
            {
                sender: "Figma",
                avatar: "https://logo.clearbit.com/figma.com",
                subject: "Your team has been updated",
                time: "9:15 AM",
            },
            {
                sender: "Notion",
                avatar: "https://logo.clearbit.com/notion.so",
                subject: "Updates to our terms of service",
                time: "8:45 AM",
            },
            {
                sender: "LinkedIn",
                avatar: "https://logo.clearbit.com/linkedin.com",
                subject: "You have 5 new connections",
                time: "Yesterday",
            },
            {
                sender: "GitHub",
                avatar: "https://logo.clearbit.com/github.com",
                subject: "1 new commit in mailgent-ai",
                time: "Yesterday",
            },
        ],
    },
    {
        key: "sent",
        title: "Last sent",
        accent: "#7C3AED",
        icon: <Mail size={18} />,
        items: [
            {
                sender: "Adeel",
                email: "adeel@example.com",
                avatar: "https://ui-avatars.com/api/?name=Adeel&background=7C3AED&color=fff",
                subject: "Project Update - Mailgent AI",
                time: "11:20 AM",
            },
            {
                sender: "Team",
                email: "team@example.com",
                avatar: "https://ui-avatars.com/api/?name=Team&background=7C3AED&color=fff",
                subject: "Meeting Notes",
                time: "Yesterday",
            },
            {
                sender: "Client",
                email: "client@example.com",
                avatar: "https://ui-avatars.com/api/?name=Client&background=7C3AED&color=fff",
                subject: "Proposal for Collaboration",
                time: "Yesterday",
            },
            {
                sender: "HR",
                email: "hr@example.com",
                avatar: "https://ui-avatars.com/api/?name=HR&background=7C3AED&color=fff",
                subject: "Leave Application",
                time: "2 days ago",
            },
            {
                sender: "Info",
                email: "info@example.com",
                avatar: "https://ui-avatars.com/api/?name=Info&background=7C3AED&color=fff",
                subject: "Query Regarding Subscription",
                time: "2 days ago",
            },
        ],
    },
    {
        key: "important",
        title: "Important mails",
        accent: "#EA4335",
        icon: <Star size={18} />,
        items: [
            {
                sender: "Google Workspace",
                avatar: "https://logo.clearbit.com/google.com",
                subject: "Your invoice is ready",
                time: "10:00 AM",
            },
            {
                sender: "Microsoft",
                avatar: "https://logo.clearbit.com/microsoft.com",
                subject: "Important: Security Update",
                time: "Yesterday",
            },
            {
                sender: "Stripe",
                avatar: "https://logo.clearbit.com/stripe.com",
                subject: "Payment of $149 received",
                time: "2 days ago",
            },
            {
                sender: "AWS Notifications",
                avatar: "https://logo.clearbit.com/aws.amazon.com",
                subject: "Your AWS service is scheduled for maintenance",
                time: "2 days ago",
            },
            {
                sender: "Cloudflare",
                avatar: "https://logo.clearbit.com/cloudflare.com",
                subject: "Action required for domain renewal",
                time: "3 days ago",
            },
        ],
    },
];

export default function Home({ user }) {
    const userName = user?.name || "there";
    const userEmail = user?.email || "demo@gmail.com"

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

                    <div className="flex items-center gap-2 rounded-full border border-[#E8EAED] bg-white px-4 py-2 shadow-sm">
                        <Mail size={16} className="text-[#4285F4]" />
                        <span className="font-semibold text-[#202124]">1,248</span>
                        <span className="text-sm text-[#5F6368]">Inbox</span>
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-[#E8EAED] bg-white px-4 py-2 shadow-sm">
                        <Star size={16} className="text-[#EA4335]" />
                        <span className="font-semibold text-[#202124]">34</span>
                        <span className="text-sm text-[#5F6368]">Important</span>
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-[#E8EAED] bg-white px-4 py-2 shadow-sm">
                        <PenSquare size={16} className="text-[#FBBC05]" />
                        <span className="font-semibold text-[#202124]">5</span>
                        <span className="text-sm text-[#5F6368]">Drafts</span>
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-[#E8EAED] bg-white px-4 py-2 shadow-sm">
                        <Send size={16} className="text-[#34A853]" />
                        <span className="font-semibold text-[#202124]">18</span>
                        <span className="text-sm text-[#5F6368]">Sent Today</span>
                    </div>

                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {sections.map((section) => (
                        <MessagesCard key={section.key} section={section} />
                    ))}
                </div>


                <div className="mb-8 overflow-hidden rounded-[30px] border border-[#E8EAED] bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFF] to-[#EEF4FF] shadow-sm">

                    {/* Top Gradient */}
                    <div className="h-1.5 bg-gradient-to-r from-[#4285F4] via-[#34A853] to-[#FBBC05]" />

                    <div className="flex flex-col gap-8 p-7 lg:flex-row lg:items-center lg:justify-between">

                        {/* Left */}

                        <div className="max-w-3xl">

                            <div className="inline-flex items-center gap-2 rounded-full border border-[#D2E3FC] bg-white px-4 py-2 shadow-sm">

                                <Bot
                                    size={16}
                                    className="text-[#4285F4]"
                                />

                                <span className="text-sm font-semibold text-[#1A73E8]">
                                    AI Preferences
                                </span>

                            </div>

                            <h2 className="mt-5 text-4xl font-bold tracking-tight text-[#202124]">
                                Train your AI once.
                                <span className="block text-[#4285F4]">
                                    It remembers forever.
                                </span>
                            </h2>

                            <p className="mt-4 max-w-2xl text-[15px] leading-8 text-[#5F6368]">
                                Define how your AI should write emails, respond to clients,
                                summarize conversations, and organize your inbox.
                                Every preference is automatically applied whenever
                                your assistant drafts, replies or processes emails.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">

                                <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
                                    <CircleCheck
                                        size={16}
                                        className="text-[#34A853]"
                                    />
                                    <span className="text-sm font-medium">
                                        Applied automatically
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
                                    <Sparkles
                                        size={16}
                                        className="text-[#FBBC05]"
                                    />
                                    <span className="text-sm font-medium">
                                        Used by every AI reply
                                    </span>
                                </div>

                            </div>

                        </div>

                        {/* Right */}

                        <div className="flex w-full max-w-sm flex-col gap-4">

                            <div className="rounded-3xl border border-[#E8EAED] bg-white p-5 shadow-sm">

                                <div className="flex items-end justify-between">

                                    <div>

                                        <p className="text-sm text-[#5F6368]">
                                            Active Preferences
                                        </p>

                                        <h3 className="mt-1 text-4xl font-bold text-[#202124]">
                                        6
                                        </h3>

                                    </div>

                                    <div className="rounded-2xl bg-[#E8F0FE] p-3">

                                        <Bot
                                            size={28}
                                            className="text-[#4285F4]"
                                        />

                                    </div>

                                </div>

                                <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#EEF2F6]">
                                    <div className="h-full w-full rounded-full bg-gradient-to-r from-[#4285F4] to-[#34A853]" />
                                </div>

                                <p className="mt-3 text-sm text-[#5F6368]">
                                    Your AI is fully personalized.
                                </p>

                            </div>

                            <Link
                                href="/preferences"
                                className="flex items-center justify-center gap-2 rounded-2xl bg-[#4285F4] px-5 py-4 font-semibold text-white transition hover:bg-[#1A73E8]"
                            >
                                <Plus size={18} />
                                See All Prerences
                            </Link>

                        </div>

                    </div>

                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {preferences.map((preference) => (
                        <PreferenceCard
                            key={preference.id}
                            preference={preference}
                        />
                    ))}
                </div>


            </section>
        </main>
    );
}






