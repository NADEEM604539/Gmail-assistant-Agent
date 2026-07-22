"use client";

import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MessagesCard({ section }) {
	const router = useRouter();

	return (
		<div className="group overflow-hidden rounded-3xl border border-[#E8EAED] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
			{/* Accent */}
			<div
				className="h-1.5 w-full"
				style={{ backgroundColor: section.accent }}
			/>

			<div className="p-5">

				{/* Header */}
				<div
					onClick={() => router.push(`/${section.key}`)}
					className="flex cursor-pointer items-center justify-between"
				>
					<div className="flex items-center gap-3">

						<div
							className="flex h-10 w-10 items-center justify-center rounded-2xl"
							style={{
								backgroundColor: `${section.accent}15`,
								color: section.accent,
							}}
						>
							{section.icon}
						</div>

						<div>
							<h2 className="text-[16px] font-semibold text-[#202124]">
								{section.title}
							</h2>

							<p className="text-xs text-[#5F6368]">
								Last 5 emails
							</p>
						</div>

					</div>

					<div className="rounded-full p-2 transition hover:bg-[#F3F7FF]">
						<ChevronRight
							size={18}
							className="text-[#9AA0A6]"
						/>
					</div>
				</div>

				{/* Messages */}

				<div className="mt-4 space-y-2">

					{section.items.map((item) => (
						<div
							key={`${section.key}-${item.subject}`}
							className="flex cursor-pointer items-center justify-between rounded-xl bg-[#FAFBFF] px-3 py-2.5 transition-all duration-300 hover:bg-white hover:shadow-sm"
						>

							<div className="flex min-w-0 items-center gap-3">

								<Image
									src={item.avatar}
									alt={item.sender}
									width={38}
									height={38}
									className="rounded-full border border-[#E8EAED] object-cover"
								/>

								<div className="min-w-0">

									<div className="flex items-center gap-2">

										<p className="truncate text-sm font-semibold text-[#202124]">
											{item.sender}
										</p>

										{item.email && (
											<>
												<span className="text-[#BDC1C6]">
													•
												</span>

												<p className="truncate text-[11px] text-[#80868B]">
													{item.email}
												</p>
											</>
										)}

									</div>

									<p className="truncate text-[13px] text-[#5F6368]">
										{item.subject}
									</p>

								</div>

							</div>

							<p className="ml-3 whitespace-nowrap text-[11px] font-medium text-[#9AA0A6]">
								{item.time}
							</p>

						</div>
					))}

				</div>

			</div>
		</div>
	);
}