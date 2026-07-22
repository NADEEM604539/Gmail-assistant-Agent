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

export default function DetailRow({ label, value }) {
	return (
		<div className="flex items-center justify-between gap-4 border-b border-[#F1F3F4] pb-3 last:border-b-0 last:pb-0">
			<span className="font-medium text-[#5F6368]">{label}</span>
			<span className="text-right font-semibold text-[#202124]">{value}</span>
		</div>
	);
}
