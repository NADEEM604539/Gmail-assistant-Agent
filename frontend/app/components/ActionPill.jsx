import {
	ArrowRight,
	Bot,
	ChevronRight,
	CircleCheck,
	Clock3,
	Inbox,
	Mail,
	MessageSquareText,
	PenSquare,
	Sparkles,
	Star,
	CircleUserRound,
} from "lucide-react";

export default function ActionPill({ label }) {
	return (
		<div className="flex items-center justify-between rounded-2xl border border-[#E8EAED] bg-[#F8FAFF] px-4 py-3 text-sm font-medium text-[#202124] transition hover:border-[#D2E3FC] hover:bg-[#EEF4FF]">
			<span>{label}</span>
			<ArrowRight size={16} className="text-[#1A73E8]" />
		</div>
	);
}