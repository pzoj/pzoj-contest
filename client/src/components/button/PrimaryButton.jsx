import Link from "next/link";

const PrimaryButton = (props) => {
	const { link, target, text, bgColor, fullWidth, submit, onClick } = props;

	return (
		<Link
			type={submit && "submit"}
			href={link}
			target={target}
			rel={target === "_blank" ? "noopener noreferrer" : ""}
			className={(props.className || '') + ` relative p-0.5 inline-flex items-center justify-center overflow-hidden group rounded-lg ${fullWidth && "w-full"}`}
			onClick={onClick}
		>
			<span className="w-full h-full bg-gradient-to-br from-emerald-400 to-sky-500 group-hover:from-emerald-400 group-hover:to-sky-500 absolute"></span>
			<span
				className={`text-grey-1 relative px-6 py-2 transition-colors duration-200 ease-in-out bg-${bgColor} ${fullWidth && "w-full"} rounded-md group-hover:bg-opacity-0 hover:text-white-0`}
			>
				{text}
			</span>
		</Link>
	);
};

export default PrimaryButton;
