import { FC, useMemo } from "react";
import ActionDropdown, { ActionDropdownOption } from "../components/actionDropdown";
import { useRouter } from "next/navigation";
import BarChartIcon from '@mui/icons-material/BarChart';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChalkboardUser } from '@fortawesome/free-solid-svg-icons'

export interface RankingsDropdownProps {}

const RankingsDropdown: FC<RankingsDropdownProps> = ({

}: RankingsDropdownProps) => {

  const router = useRouter();

  const rankingsOptions: ActionDropdownOption[] = useMemo(() => {
    const hardestCourses = {
      label: 'Hardest Courses',
      id: 'hardest-courses',
      onClick: () => {
        router.push('/rankings/course');
      },
      customIcon: (
        <AutoStoriesIcon 
          style={{
            width: '16px',
          }}
        />
      )
    };
    const hardestProfs = {
      label: 'Hardest Professors',
      id: 'hardest-profs',
      onClick: () => {
        router.push('/rankings/prof');
      },
      customIcon: (
        <FontAwesomeIcon icon={faChalkboardUser} />
      )
    }

    return [
      hardestCourses,
      hardestProfs,
    ];
  }, []);

  return (
    <ActionDropdown
      options={rankingsOptions}
      trigger={<BarChartIcon />}
      type={'auto'}
      text={'Rankings'}
    />
  )
}

export default RankingsDropdown;