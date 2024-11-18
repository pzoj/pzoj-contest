import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleXmark, faStar } from "@fortawesome/free-regular-svg-icons";

const Table = (props) => {
	const { data } = props;

	return (
		<div className="w-full bg-dark-1 px-[1.5rem] py-[1.5rem] border border-border rounded">
			<table className="w-full">
				<thead>
					<tr className="text-grey-1">
						<th className="pb-3">Status</th>
						<th className="pb-3">Problem</th>
						<th className="pb-3">Rating</th>
						<th className="pb-3">Tag</th>
					</tr>
				</thead>

				<tbody className="border-t border-border">
					{
						data.map((problem, idx) => {
							return (
					<tr key={idx} className={`text-center text-grey-1 ${idx % 2 && "bg-dark-2"}`}>
						<td className="py-3">
							{problem.status ? <FontAwesomeIcon icon={faCircleCheck} className="w-[1.2rem] m-auto text-xl text-emerald-400" /> : <FontAwesomeIcon icon={faCircleXmark} className="w-[1.2rem] m-auto text-xl text-red-500" />}
						</td>
						<td className="py-3">
							<Link
								href={problem.problemLink}
								className="text-blue-1 transition duration-200 hover:text-blue-0"
							>
								{problem.problemTitle}
							</Link>
						</td>
						<td className="py-3">
							<span className="text-yellow-200">{problem.rating} {<FontAwesomeIcon icon={faStar} className="text-xl w-[1.1rem] m-auto inline-block mt-[-0.3rem]" />}</span>
						</td>
						<td className="py-3">
							<span className="border-2 border-emerald-400 rounded-xl px-2 py-1 text-emerald-400 text-xs">{problem.tag}</span>
						</td>
					</tr>
					);
						})
					}
				</tbody>
			</table>
		</div>
	);
};

export default Table;