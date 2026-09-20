import type { DayDict, PhaseDict } from '../../content';
import { siDays1to10 } from './days-01-10';
import { siDays11to20 } from './days-11-20';
import { siDays21to30 } from './days-21-30';

/** Split into three files purely for authoring size — merged back here. */
export const curriculumSi: DayDict = {
  ...siDays1to10,
  ...siDays11to20,
  ...siDays21to30,
};

export const phasesSi: PhaseDict = {
  foundation: {
    title: 'පදනම',
    blurb: 'ශබ්ද නිපදවන්නේ කොහේද, සහ පනින හා රැව් දෙන ඒවා කුමක්ද.',
  },
  nasal: {
    title: 'නාසික පවුල',
    blurb: 'නූන් සහ මීම් — කුර්ආනයේ සෑම කොළ නියමයක්ම.',
  },
  elongation: {
    title: 'මද් ඉණිමඟ',
    blurb: 'ගණන් 2ක රැඳවීමේ සිට පූර්ණ 6 දක්වා.',
  },
  weight: {
    title: 'බර සහ නිහඬතාව',
    blurb: 'බර එදිරිව සැහැල්ලු, සහ ඔබ කිසිදා නොකියන අකුරු.',
  },
  mastery: {
    title: 'ප්‍රවීණත්වය',
    blurb: 'දුර්ලභ මද්, වක්ෆ්, සහ උපකාරයකින් තොරව සම්පූර්ණ සූරා කියවීම.',
  },
};
