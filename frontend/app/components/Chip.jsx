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
export default function Chip({ icon, label }) {
	return (
		<div className="inline-flex items-center gap-2 rounded-full border border-[#E8EAED] bg-white px-4 py-2 shadow-sm">
			<span className="text-[#1A73E8]">{icon}</span>
			<span>{label}</span>
		</div>
	);
}