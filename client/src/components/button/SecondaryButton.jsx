import Link from "next/link";

const SecondaryButton = (props) => {
    const { link, target, text, fullWidth, onClick } = props;

    return (
        <Link
            href={link}
            target={target}
            rel={(target === "_blank") && "noopener noreferrer"}
            className={`border border-border text-grey-1 px-6 py-2 transition duration-200 hover:bg-border rounded-lg ${fullWidth && "w-full"}`}
            onClick={onClick}
        >   
            {text}
        </Link>
    );
};

export default SecondaryButton;
