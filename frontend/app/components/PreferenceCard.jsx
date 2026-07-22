import { Pencil, Trash2 } from "lucide-react";

export default function PreferenceCard({ preference }) {
	const Icon = preference.icon;

	return (
		<div className="group relative overflow-hidden rounded-xl border border-[#E8EAED] bg-white p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D2E3FC] hover:shadow-md">

			{/* Accent */}
			<div
				className="absolute left-0 top-0 h-full w-1"
				style={{ backgroundColor: preference.color }}
			/>

			{/* Header */}
			<div className="flex items-center gap-2">

				<div
					className="flex h-8 w-8 items-center justify-center rounded-lg"
					style={{
						backgroundColor: `${preference.color}15`,
						color: preference.color,
					}}
				>
					<Icon size={16} />
				</div>

				<div className="min-w-0 flex-1">
					<p className="text-[10px] uppercase tracking-wider text-[#9AA0A6]">
						Preference
					</p>

					<h3 className="truncate text-sm font-semibold text-[#202124]">
						{preference.title}
					</h3>
				</div>

			</div>

			{/* Value */}

			<div
				className="mt-2 rounded-lg px-2.5 py-2"
				style={{
					backgroundColor: `${preference.color}10`,
				}}
			>
				<p className="line-clamp-2 whitespace-pre-line text-sm font-semibold text-[#202124]">
					{preference.value}
				</p>
			</div>

			{/* Description */}

			<p className="mt-2 line-clamp-2 text-xs leading-5 text-[#5F6368]">
				{preference.description}
			</p>

			{/* Footer */}

			<div className="mt-3 flex items-center justify-between border-t border-[#F1F3F4] pt-2">

				<span className="text-[11px] text-[#9AA0A6]">
					Applied
				</span>

				<div className="flex gap-1">

					<button className="rounded-md p-1.5 text-[#4285F4] transition hover:bg-[#E8F0FE]">
						<Pencil size={14} />
					</button>

					<button className="rounded-md p-1.5 text-[#EA4335] transition hover:bg-[#FDECEC]">
						<Trash2 size={14} />
					</button>

				</div>

			</div>

		</div>
	);
}