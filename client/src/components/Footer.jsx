import SecondaryButton from './button/SecondaryButton';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { faCode } from "@fortawesome/free-solid-svg-icons";

const Footer = () => {
    const currYear = new Date().getFullYear();

    return (
        <footer className="text-center">
            <hr
                className="w-[20rem] m-auto border-b border-border mt-[4rem] mb-[2rem]"
            />

            <span className="mr-2">
                <SecondaryButton
                    link="https://github.com/pzoj/pzoj"
                    target="_blank"
                    text={
                        <span>
                            <FontAwesomeIcon icon={faGithub} className="text-xl w-[1.2rem] inline-block mr-0.5 mt-[-0.23rem]" /> Github
                        </span>
                    }
                    bgColor="bg-dark-0"
                />
            </span>

            <span className="ml-2">
                <SecondaryButton
                    link="https://devpost.com/software/pzoj"
                    target="_blank"
                    text={
                        <span>
                            <FontAwesomeIcon icon={faCode} className="text-xl w-[1.2rem] inline-block mr-0.5 mt-[-0.23rem]" /> Devpost
                        </span>
                    }
                    bgColor="bg-dark-0"
                />
            </span>

            <p className="text-grey-1 mt-[1.5rem] pb-6">&copy; {currYear} Team int0x80</p>
        </footer>
    );
};

export default Footer;