import Link from "next/link";

const SecondaryButton = (props) => {
    const { link, target, text, onClick } = props;

    return (
        <Link
            href={link}
            target={target}
            rel={(target === "_blank") && "noopener noreferrer"}
            className="font-bold border-2 border-red-500 text-red-500 px-6 py-2 transition duration-200 hover:bg-red-500 hover:text-dark-1 rounded-lg"
            onClick={onClick}
        >   
            {text}
        </Link>
    );
};

export default SecondaryButton;
