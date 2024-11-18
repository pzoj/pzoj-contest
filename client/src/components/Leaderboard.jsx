const Leaderboard = ({ users }) => {
	if (users.length === 0) return null;

	let rank = 1;
	
	return (
		<div className="justify-center flex">
			<table className="text-slate-100 border border-stone-400 p-3">
				<thead>
					<tr>
						<th className="border border-stone-400 p-3">Rank</th>
						<th className='border border-stone-400 p-3'>Username</th>
						{/* {Object.keys(users[0].problems).map((key, index) => (
							<th className='border border-stone-400 p-3' key={index}>{key}</th>
						))} */}
						{/*sort the problems based on problems[i].difficulty*/}
						{Object.keys(users[0].problems).sort((a, b) => users[0].problems[a].difficulty - users[0].problems[b].difficulty).map((key, index) => (
							<th className='border border-stone-400 p-3' key={index}>{key}</th>
						))}
						<th className='border border-stone-400 p-3'>Total Score</th>
						<th className='border border-stone-400 p-3'>Penalty Time</th>
					</tr>
				</thead>
				<tbody>
					{users.map((user) => (
						<tr key={user.username}>
							<td className='border border-stone-400 p-3'>{rank++}</td>
							<td className='border border-stone-400 p-3'>{user.username}</td>
							{/* {Object.keys(user.problems).map((key, index) => (
								<td className={`border border-stone-400 p-3 ${user.problems[key].score==100?"text-green-500":"text-red-500"} text-center`} key={index}>
									{user.problems[key].score?user.problems[key].score:""} {user.problems[key].score?`(${user.problems[key].penalty})`:""}
								</td>
							))} */}
							{/*sort the problems based on problems[i].difficulty*/}
							{Object.keys(user.problems).sort((a, b) => user.problems[a].difficulty - user.problems[b].difficulty).map((key, index) => (
								<td className={`border border-stone-400 p-3 ${user.problems[key].score?"text-green-500":"text-red-500"} text-center`} key={index}>
									{user.problems[key].penalty?(user.problems[key].score?`+${user.problems[key].score>1?user.problems[key].score-1:""}`:"-"):""} {user.problems[key].penalty?`(${user.problems[key].penalty})`:""}
								</td>
							))}
							<td className='border border-stone-400 p-3 text-center'>{user.points}</td>
							<td className='border border-stone-400 p-3 text-center'>{user.penaltytime}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default Leaderboard;