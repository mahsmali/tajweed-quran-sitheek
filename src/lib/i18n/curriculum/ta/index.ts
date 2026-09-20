import type { DayDict, PhaseDict } from '../../content';
import { taDays1to10 } from './days-01-10';
import { taDays11to20 } from './days-11-20';
import { taDays21to30 } from './days-21-30';

/** Split into three files purely for authoring size — merged back here. */
export const curriculumTa: DayDict = {
  ...taDays1to10,
  ...taDays11to20,
  ...taDays21to30,
};

export const phasesTa: PhaseDict = {
  foundation: {
    title: 'அடித்தளம்',
    blurb: 'ஒலிகள் எங்கே உருவாகின்றன, துள்ளுவதும் ஒலிப்பதும் எவை.',
  },
  nasal: {
    title: 'மூக்கொலிக் குடும்பம்',
    blurb: 'நூனும் மீமும் — குர்ஆனின் ஒவ்வொரு பச்சை விதியும்.',
  },
  elongation: {
    title: 'மத் ஏணி',
    blurb: '2-அளவு நிறுத்தத்திலிருந்து முழு 6 வரை.',
  },
  weight: {
    title: 'கனமும் மௌனமும்',
    blurb: 'கனத்திற்கு எதிராக இலகு, மற்றும் நீங்கள் ஒருபோதும் சொல்லாத எழுத்துகள்.',
  },
  mastery: {
    title: 'தேர்ச்சி',
    blurb: 'அரிய மத்கள், வக்ஃப், மற்றும் உதவியின்றி முழுச் சூராக்களை ஓதுதல்.',
  },
};
