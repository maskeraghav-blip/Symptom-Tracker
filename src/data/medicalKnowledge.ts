import { BODY_REGIONS } from './bodyParts';

// Casing and shape requirement:
// complaints -> [ComplaintName] -> descriptors/associated/triggers/relievers/otc/followUps
export interface ComplaintData {
  descriptors: string[];
  associated: string[];
  triggers: string[];
  relievers: string[];
  otc: string[];
  followUps: string[];
}

export interface InterviewNode {
  title: string;
  options: string[];
  type: 'select-subregions' | 'select-complaint' | 'select-descriptor' | 'severity' | 'onset' | 'frequency' | 'triggers-relievers' | 'medication' | 'associated-followup';
  symptomData: ComplaintData;
  isComplete: boolean;
}

export const normalizeSubRegionKey = (name: string): string => {
  const norm = (name || '').toLowerCase().trim();

  // Systems
  if (norm.includes('respiratory')) return 'respiratory';
  if (norm.includes('cardiovascular')) return 'cardiovascular';
  if (norm.includes('neurological')) return 'neurological';
  if (norm.includes('digestive')) return 'digestive';
  if (norm.includes('urinary')) return 'urinary';
  if (norm.includes('mental') || norm.includes('health')) return 'mental_health';
  if (norm.includes('general') || norm.includes('body')) return 'general';
  if (norm.includes('skin')) return 'skin';
  if (norm.includes('musculoskeletal')) return 'musculoskeletal';

  // Subregions
  if (norm.includes('tongue')) return 'tongue';
  if (norm.includes('forehead')) return 'forehead';
  if (norm.includes('left temple') || norm.includes('left_temple')) return 'left_temple';
  if (norm.includes('right temple') || norm.includes('right_temple')) return 'right_temple';
  if (norm.includes('scalp')) return 'scalp';
  if (norm.includes('back of head') || norm.includes('back_head')) return 'back_head';
  if (norm.includes('eye')) return 'eyes';
  if (norm.includes('ear')) return 'ears';
  if (norm.includes('sinus')) return 'sinuses';
  if (norm.includes('jaw')) return 'jaw';
  if (norm.includes('teeth')) return 'teeth';
  if (norm.includes('mouth')) return 'mouth';
  if (norm.includes('nose')) return 'nose';

  if (norm.includes('throat') || norm.includes('front of neck') || norm.includes('front_neck')) return 'throat';
  if (norm.includes('back of neck') || norm.includes('back_neck')) return 'back_neck';
  if (norm.includes('sides of neck') || norm.includes('sides_neck')) return 'sides_neck';
  if (norm.includes('thyroid')) return 'thyroid';

  if (norm.includes('shoulder')) return 'shoulder';
  if (norm.includes('bicep') || norm.includes('upper_arm_bicep')) return 'upper_arm';
  if (norm.includes('tricep') || norm.includes('upper_arm_tricep')) return 'upper_arm';
  if (norm.includes('upper arm') || norm.includes('upper_arm')) return 'upper_arm';
  if (norm.includes('elbow')) return 'elbow';
  if (norm.includes('forearm')) return 'forearm';
  if (norm.includes('wrist')) return 'wrist';
  if (norm.includes('hand') || norm.includes('palm') || norm.includes('palm_hand') || norm.includes('back of hand')) return 'hand';
  if (norm.includes('finger') || norm.includes('thumb')) return 'hand';

  if (norm.includes('hip')) return 'hip';
  if (norm.includes('groin')) return 'groin';
  if (norm.includes('thigh') || norm.includes('quadriceps') || norm.includes('hamstrings')) return 'thigh';
  if (norm.includes('knee')) return 'knee';
  if (norm.includes('shin')) return 'shin';
  if (norm.includes('calf')) return 'calf';
  if (norm.includes('ankle')) return 'ankle';
  if (norm.includes('heel')) return 'heel';
  if (norm.includes('sole') || norm.includes('plantar')) return 'sole';
  if (norm.includes('foot')) return 'foot';
  if (norm.includes('toe')) return 'foot';

  // Fallbacks
  if (norm.includes('chest')) return 'chest';
  if (norm.includes('back')) return 'back';
  if (norm.includes('abd') || norm.includes('abdomen')) return 'abdomen';
  if (norm.includes('pelvis')) return 'pelvis';

  return 'generic';
};

export const medicalKnowledge: Record<string, { complaints: Record<string, ComplaintData> }> = {
  // Head & Face Subregions
  tongue: {
    complaints: {
      Pain: {
        descriptors: ['Burning', 'Sharp', 'Throbbing', 'Sore', 'Stinging', 'Ulcerated'],
        associated: ['Difficulty eating', 'Difficulty swallowing', 'Taste changes', 'Bad breath'],
        triggers: ['Hot drinks', 'Spicy foods', 'Acidic foods', 'Chewing', 'Talking'],
        relievers: ['Cold water', 'Soft foods', 'Saltwater rinse', 'Resting tongue'],
        otc: ['Canker cover', 'Acetaminophen', 'Paracetamol'],
        followUps: ['Recent tongue bite?', 'White coating?', 'Difficulty swallowing?', 'Bleeding?']
      },
      Burning: {
        descriptors: ['Scalding', 'Dry', 'Constant', 'Stinging'],
        associated: ['Dry mouth', 'Metallic taste', 'Thirst'],
        triggers: ['Spicy food', 'Hot beverages', 'Anxiety', 'Toothpaste'],
        relievers: ['Ice chips', 'Sips of water', 'Chewing gum'],
        otc: ['Artificial saliva'],
        followUps: ['Worse at night?', 'Taste changes?']
      },
      Ulcer: {
        descriptors: ['Raw', 'Stinging', 'White center', 'Bitten'],
        associated: ['Localized swelling', 'Difficulty eating', 'Gum irritation'],
        triggers: ['Acidic food', 'Stress', 'Accidental bite', 'Toothpaste SLS'],
        relievers: ['Saltwater rinse', 'Ice application', 'Soft foods'],
        otc: ['Acetaminophen', 'Canker cover'],
        followUps: ['Multiple ulcers?', 'Fever present?']
      },
      Swelling: {
        descriptors: ['Tight', 'Enlarged', 'Thick', 'Puffy'],
        associated: ['Difficulty speaking', 'Difficulty breathing', 'Drooling'],
        triggers: ['Food allergy', 'Medication reaction', 'Insect bite', 'Trauma'],
        relievers: ['Cold compress', 'Sucking on ice', 'Resting'],
        otc: ['Antihistamine', 'Diphenhydramine'],
        followUps: ['Difficulty breathing?', 'Sudden onset?']
      }
    }
  },
  forehead: {
    complaints: {
      Pain: {
        descriptors: ['Sharp', 'Throbbing', 'Pressure', 'Band-like', 'Pulsating', 'Dull'],
        associated: ['Light sensitivity', 'Sound sensitivity', 'Nausea', 'Blurred vision'],
        triggers: ['Stress', 'Sleep deprivation', 'Bright lights', 'Screen time'],
        relievers: ['Dark room', 'Rest', 'Hydration', 'Cool compress'],
        otc: ['Ibuprofen', 'Paracetamol', 'Naproxen'],
        followUps: ['Is it one-sided?', 'Does light make it worse?', 'Any nausea?']
      }
    }
  },
  left_temple: {
    complaints: {
      Pain: {
        descriptors: ['Sharp', 'Throbbing', 'Behind eye', 'One-sided', 'Light sensitivity'],
        associated: ['Nausea', 'Sound sensitivity', 'Blurred vision'],
        triggers: ['Stress', 'Lack of sleep', 'Bright lights', 'Dehydration'],
        relievers: ['Dark room', 'Rest', 'Hydration', 'Pain medication'],
        otc: ['Paracetamol', 'Ibuprofen', 'Naproxen'],
        followUps: ['One-sided temple pain?', 'Aura present?', 'Nausea?']
      }
    }
  },
  right_temple: {
    complaints: {
      Pain: {
        descriptors: ['Sharp', 'Throbbing', 'Behind eye', 'One-sided', 'Light sensitivity'],
        associated: ['Nausea', 'Sound sensitivity', 'Blurred vision'],
        triggers: ['Stress', 'Lack of sleep', 'Bright lights', 'Dehydration'],
        relievers: ['Dark room', 'Rest', 'Hydration', 'Pain medication'],
        otc: ['Paracetamol', 'Ibuprofen', 'Naproxen'],
        followUps: ['One-sided temple pain?', 'Aura present?', 'Nausea?']
      }
    }
  },
  scalp: {
    complaints: {
      Pain: {
        descriptors: ['Tenderness', 'Burning', 'Soreness when touched', 'Electric twitches'],
        associated: ['Headache', 'Neck stiffness', 'Itching'],
        triggers: ['Hair styling', 'Cold air', 'Stress', 'Rubbing'],
        relievers: ['Gentle heat', 'Rest', 'Massage'],
        otc: ['Ibuprofen', 'Acetaminophen'],
        followUps: ['Visible rash?', 'Recent hair dyes?']
      }
    }
  },
  back_head: {
    complaints: {
      Pain: {
        descriptors: ['Dull pressure', 'Throbbing base of skull', 'Sharp shoots', 'Tension lock'],
        associated: ['Neck stiffness', 'Shoulder tightness', 'Dizziness'],
        triggers: ['Poor posture', 'Sleep position', 'Screen work', 'Lifting heavy'],
        relievers: ['Neck stretch', 'Warm compress', 'Hydration', 'Neck massage'],
        otc: ['Ibuprofen', 'Naproxen', 'Paracetamol'],
        followUps: ['Radiates to neck?', 'Morning stiffness?']
      }
    }
  },
  eyes: {
    complaints: {
      Pain: {
        descriptors: ['Sharp', 'Burning', 'Pressure', 'Scratchy', 'Behind eye', 'Dull ache'],
        associated: ['Redness', 'Watery eyes', 'Blurred vision', 'Light sensitivity'],
        triggers: ['Screen time', 'Bright lights', 'Contact lenses', 'Reading'],
        relievers: ['Dark room', 'Rest', 'Lubricating eye drops', 'Cool compress'],
        otc: ['Artificial tears', 'Acetaminophen'],
        followUps: ['Vision affected?', 'Recent injury?', 'Contact lenses?', 'Discharge?']
      },
      Redness: {
        descriptors: ['Bloodshot', 'Pink shade', 'Veiny', 'Dry irritation'],
        associated: ['Itching', 'Discharge', 'Gritty feeling', 'Swelling'],
        triggers: ['Allergens', 'Wind', 'Dust', 'Lack of sleep', 'Rubbing eyes'],
        relievers: ['Cold compress', 'Avoiding rubbing', 'Resting eyes'],
        otc: ['Artificial tears', 'Naphazoline drops'],
        followUps: ['Itchy eyes?', 'Sticky discharge?']
      }
    }
  },
  ears: {
    complaints: {
      Pain: {
        descriptors: ['Sharp ache', 'Dull pressure', 'Throbbing inside', 'Deep itching'],
        associated: ['Muffled hearing', 'Ringing (tinnitus)', 'Jaw alignment pain'],
        triggers: ['Chewing', 'Swallowing', 'Loud noise', 'Cold winds'],
        relievers: ['Warm compress', 'Resting', 'Keeping ear dry'],
        otc: ['Paracetamol', 'Ibuprofen'],
        followUps: ['Fluid discharge?', 'Reduced hearing?', 'Recent swimming?']
      }
    }
  },
  sinuses: {
    complaints: {
      Pain: {
        descriptors: ['Tender cheekbones', 'Sinus pressure', 'Heavy forehead', 'Nose bridge soreness'],
        associated: ['Nasal congestion', 'Headache', 'Post-nasal drip', 'Blocked nose'],
        triggers: ['Laying down', 'Cold wind', 'Allergens', 'Air pressure changes'],
        relievers: ['Steam inhalation', 'Saline flush', 'Warm forehead compress'],
        otc: ['Pseudoephedrine', 'Saline spray', 'Loratadine'],
        followUps: ['Thick discharge?', 'Fever present?']
      }
    }
  },
  jaw: {
    complaints: {
      Pain: {
        descriptors: ['Jaw ache', 'Clicking joint', 'Tender muscle', 'Stiffness'],
        associated: ['Ear pressure', 'Tension headache', 'Neck stiffness'],
        triggers: ['Chewing', 'Yawning', 'Talking long', 'Teeth clenching'],
        relievers: ['Soft foods diet', 'Warm jaw compress', 'Resting jaw'],
        otc: ['Ibuprofen', 'Paracetamol'],
        followUps: ['Teeth grinding?', 'Jaw locking?']
      }
    }
  },
  teeth: {
    complaints: {
      Pain: {
        descriptors: ['Sharp ache', 'Hot/cold sensitivity', 'Throbbing gum', 'Pressure key'],
        associated: ['Jaw swelling', 'Headache', 'Sore gum line'],
        triggers: ['Cold drinks', 'Hot food', 'Chewing', 'Sweet food'],
        relievers: ['Saltwater mouthwash', 'Cold cheek compress', 'Avoiding chewing on side'],
        otc: ['Ibuprofen', 'Paracetamol'],
        followUps: ['Dental work recently?', 'Visible swelling?']
      }
    }
  },
  mouth: {
    complaints: {
      Pain: {
        descriptors: ['Raw soreness', 'Gum tenderness', 'Canker heat', 'Dry burn'],
        associated: ['Dry mouth', 'Taste loss', 'Sensitive gums'],
        triggers: ['Acids', 'Spicy foods', 'Toothbrushing'],
        relievers: ['Cold water sips', 'Soft foods', 'Saltwater rinse'],
        otc: ['Canker cover', 'Acetaminophen'],
        followUps: ['White patches?', 'Bleeding gums?']
      }
    }
  },
  nose: {
    complaints: {
      Pain: {
        descriptors: ['Sinus pressure', 'Bridge soreness', 'Congested dry soreness'],
        associated: ['Sneezing', 'Post-nasal drip', 'Nasally voice', 'Blocked nose'],
        triggers: ['Dry air', 'Allergens', 'Rubbing nose'],
        relievers: ['Saline spray', 'Steam inhalation', 'Hydration'],
        otc: ['Pseudoephedrine', 'Saline spray', 'Cetirizine'],
        followUps: ['Nosebleeds?', 'Fever present?']
      }
    }
  },

  // Neck Subregions
  throat: {
    complaints: {
      Pain: {
        descriptors: ['Scratchy', 'Raw soreness', 'Burning swallowing', 'Dry irritation'],
        associated: ['Sore lymph nodes', 'Hoarse voice', 'Difficulty swallowing', 'Cough'],
        triggers: ['Swallowing', 'Talking', 'Dry environments', 'Cold drinks'],
        relievers: ['Warm tea with honey', 'Saltwater gargle', 'Resting voice'],
        otc: ['Lozenges', 'Acetaminophen', 'Paracetamol'],
        followUps: ['Fever present?', 'Swollen tonsils?']
      }
    }
  },
  back_neck: {
    complaints: {
      Pain: {
        descriptors: ['Stiff pull', 'Sharp pinch', 'Aching base', 'Spasm'],
        associated: ['Shoulder stiffness', 'Tension headache', 'Limited rotation'],
        triggers: ['Turning head', 'Driving', 'Computer posture', 'Lifting heavy'],
        relievers: ['Gentle stretching', 'Heat pad', 'Massage'],
        otc: ['Ibuprofen', 'Naproxen', 'Diclofenac gel'],
        followUps: ['Able to touch chin to chest?', 'Radiating arm numbness?']
      }
    }
  },
  sides_neck: {
    complaints: {
      Pain: {
        descriptors: ['Swollen nodes tender', 'Aching stiffness', 'Tender muscle cords'],
        associated: ['Sore throat', 'Mild fever', 'Ear pressure'],
        triggers: ['Swallowing', 'Turning head', 'Palpation'],
        relievers: ['Warm compress', 'Resting', 'Hydration'],
        otc: ['Paracetamol', 'Ibuprofen'],
        followUps: ['Nodes swollen for over a week?', 'Fever present?']
      }
    }
  },
  thyroid: {
    complaints: {
      Pain: {
        descriptors: ['Front pressure tender', 'Deep ache', 'Difficulty swallowing'],
        associated: ['Hoarse voice', 'Neck tightness', 'Fatigue'],
        triggers: ['Swallowing', 'Touch pressure'],
        relievers: ['Warm compress', 'Resting', 'Sips of water'],
        otc: ['Paracetamol'],
        followUps: ['Rapid weight changes?', 'Difficulty breathing?']
      }
    }
  },

  // Chest Subregions
  chest: {
    complaints: {
      Pain: {
        descriptors: ['Pressure', 'Tightness', 'Burning', 'Sharp', 'Stabbing', 'Heavy discomfort'],
        associated: ['Shortness of breath', 'Palpitations', 'Sweating', 'Pain on breathing', 'Dry cough'],
        triggers: ['Exercise', 'Deep breathing', 'Movement', 'Eating', 'Stress'],
        relievers: ['Resting upright', 'Changing position', 'Antacid', 'Slow breathing'],
        otc: ['Paracetamol', 'Ibuprofen', 'Antacid'],
        followUps: ['Does it worsen with exertion?', 'Does deep breathing affect it?', 'Did it begin suddenly?']
      },
      Tightness: {
        descriptors: ['Heavy constriction band', 'Difficulty breathing fully', 'Inflated lungs feel'],
        associated: ['Shortness of breath', 'Dry cough', 'Anxiety', 'Wheezing'],
        triggers: ['Exercise', 'Cold air', 'Stress', 'Pollen'],
        relievers: ['Rest', 'Relaxation techniques', 'Steam inhalation'],
        otc: ['Acetaminophen'],
        followUps: ['Pollen triggers?', 'Exercise induced?']
      }
    }
  },

  // Back Subregions
  back: {
    complaints: {
      Pain: {
        descriptors: ['Dull ache', 'Sharp spasm', 'Stabbing', 'Pulling muscle', 'Burning', 'Radiating down leg'],
        associated: ['Leg numbness', 'Leg tingling', 'Muscle spasms', 'Difficulty standing'],
        triggers: ['Bending', 'Lifting heavy', 'Standing too long', 'Sitting bad position'],
        relievers: ['Resting flat', 'Gentle stretching', 'Heat pad', 'Massage'],
        otc: ['Ibuprofen', 'Naproxen', 'Paracetamol'],
        followUps: ['Does it travel down the leg?', 'Is bending difficult?', 'Morning stiffness?']
      }
    }
  },

  // Abdomen Subregions
  abdomen: {
    complaints: {
      Pain: {
        descriptors: ['Cramping spasm', 'Burning heartburn', 'Dull bloating', 'Sharp center pinch'],
        associated: ['Nausea', 'Belching', 'Fullness feeling', 'Indigestion'],
        triggers: ['Spicy food', 'Greasy food', 'Empty stomach', 'Laying down'],
        relievers: ['Sitting upright', 'Drinking water', 'Warm compress', 'Burping'],
        otc: ['Antacid', 'Calcium carbonate', 'Famotidine'],
        followUps: ['Does it worsen after eating?', 'Is there bloating?', 'Does sitting up help?']
      }
    }
  },
  pelvis: {
    complaints: {
      Pain: {
        descriptors: ['Dull heavy pressure', 'Deep bone ache', 'Sharp groin pull', 'Cramping lower'],
        associated: ['Lower back soreness', 'Hip fatigue', 'Mild bloating'],
        triggers: ['Walking long', 'Standing up', 'Lifting objects', 'Stretching hip'],
        relievers: ['Laying flat with pillow', 'Warm abdominal pack', 'Gentle pelvic tilts'],
        otc: ['Ibuprofen', 'Naproxen', 'Paracetamol'],
        followUps: ['Worse with movement?', 'Fever present?']
      }
    }
  },

  // Upper & Lower limbs
  shoulder: {
    complaints: {
      Pain: {
        descriptors: ['Aching joint', 'Sharp lifting pinch', 'Rotator burn', 'Freezing stiffness'],
        associated: ['Limited arm raise', 'Neck stiffness', 'Clicking joint sound'],
        triggers: ['Reaching upward', 'Carrying bags', 'Sleeping on side'],
        relievers: ['Rest', 'Cold compress', 'Stretches', 'Arm support brace'],
        otc: ['Ibuprofen', 'Naproxen', 'Diclofenac gel'],
        followUps: ['Recent shoulder injury?', 'Able to lift arm?']
      }
    }
  },
  upper_arm: {
    complaints: {
      Pain: {
        descriptors: ['Bicep pull', 'Tricep soreness', 'Dull muscle ache', 'Shooting'],
        associated: ['Elbow ache', 'Reduced arm strength', 'Shoulder fatigue'],
        triggers: ['Lifting objects', 'Pushing', 'Gym workout'],
        relievers: ['Resting arm', 'Warm massage', 'Bicep stretching'],
        otc: ['Ibuprofen', 'Paracetamol'],
        followUps: ['Swollen upper arm?', 'Strength decreased?']
      }
    }
  },
  elbow: {
    complaints: {
      Pain: {
        descriptors: ['Inner joint sharp', 'Tennis elbow outer ache', 'Burning nerve', 'Tender bone'],
        associated: ['Grip weakness', 'Wrist extension pain', 'Forearm stiffness'],
        triggers: ['Typing', 'Gripping tightly', 'Lifting bags', 'Flexing elbow'],
        relievers: ['Rest', 'Elbow brace', 'Ice support', 'Massage'],
        otc: ['Ibuprofen', 'Naproxen', 'Diclofenac gel'],
        followUps: ['Swollen elbow?', 'Stiff folding?']
      }
    }
  },
  forearm: {
    complaints: {
      Pain: {
        descriptors: ['Muscle fatigue', 'Burning tendons', 'Tight flexor', 'Radiating wrist'],
        associated: ['Fingers stiffness', 'Wrist soreness', 'Grip slip'],
        triggers: ['Typing', 'Writing', 'Using tools', 'Lifting workload'],
        relievers: ['Forearm massage', 'Stretching wrists', 'Warm wrap'],
        otc: ['Ibuprofen', 'Paracetamol', 'Diclofenac gel'],
        followUps: ['Injury related?', 'Typing long hours?']
      }
    }
  },
  wrist: {
    complaints: {
      Pain: {
        descriptors: ['Sharp bend ache', 'Dull tendon draw', 'Nerve electricity', 'Tender bone'],
        associated: ['Finger tingling', 'Grip weakness', 'Forearm stiffness'],
        triggers: ['Typing', 'Flexing wrist', 'Lifting key', 'Writing'],
        relievers: ['Wrist splint', 'Resting joints', 'Ice compress'],
        otc: ['Ibuprofen', 'Naproxen', 'Diclofenac gel'],
        followUps: ['Electric tingling?', 'Swollen wrist?']
      }
    }
  },
  hand: {
    complaints: {
      Pain: {
        descriptors: ['Arthritic knuckle', 'Sharp palm cramp', 'Tendon burning', 'Cold fingers'],
        associated: ['Stiff fingers', 'Loss of dexterity', 'Tingling thumb'],
        triggers: ['Gripping objects', 'Cold environment', 'Typing', 'Opening jars'],
        relievers: ['Warm water soak', 'Finger stretches', 'Resting hands'],
        otc: ['Ibuprofen', 'Paracetamol', 'Diclofenac gel'],
        followUps: ['Joint swelling?', 'Cold sensitivity?']
      }
    }
  },
  hip: {
    complaints: {
      Pain: {
        descriptors: ['Deep groin ache', 'Outer hip tenderness', 'Sharp walking pinch', 'Thigh radiator'],
        associated: ['Knee joint stiffness', 'Limping', 'Difficulty cross-legged'],
        triggers: ['Lying on hip', 'Walking long', 'Stairs climb', 'Getting out of car'],
        relievers: ['Pillow between knees', 'Warm bath', 'Resting joints', 'Ice hip outer'],
        otc: ['Ibuprofen', 'Naproxen', 'Paracetamol'],
        followUps: ['Able to bear weight?', 'Morning stiffness?']
      }
    }
  },
  groin: {
    complaints: {
      Pain: {
        descriptors: ['Sharp strain pull', 'Dull muscular pinch', 'Aching pelvic wall'],
        associated: ['Lower abdomen pressure', 'Hip stiffness', 'Limping'],
        triggers: ['Walking fast', 'Stretching legs', 'Lifting weights'],
        relievers: ['Rest horizontally', 'Heat pad application', 'Gentle groin stretching'],
        otc: ['Ibuprofen', 'Paracetamol'],
        followUps: ['Recent sports strain?', 'Swelling present?']
      }
    }
  },
  thigh: {
    complaints: {
      Pain: {
        descriptors: ['Hamstring pulling', 'Quad soreness ache', 'Burning outer nerve', 'Deep cramp'],
        associated: ['Knee stiffness', 'Hip tightness', 'Muscle tremors'],
        triggers: ['Walking stairs', 'Rising from chair', 'Running', 'Stretching leg'],
        relievers: ['Resting leg elevated', 'Foam rolling', 'Warm massage wrap'],
        otc: ['Ibuprofen', 'Paracetamol', 'Diclofenac gel'],
        followUps: ['Muscle cramps at night?', 'Injury during activity?']
      }
    }
  },
  knee: {
    complaints: {
      Pain: {
        descriptors: ['Sharp inner knee', 'Dull kneecap ache', 'Thump underneath joint', 'Burning tendon'],
        associated: ['Clicking bone sound', 'Locking sensation', 'Instability feeling', 'Stiffness'],
        triggers: ['Running', 'Stairs', 'Squatting', 'Twisting', 'Kneeling'],
        relievers: ['Resting knee elevated', 'Knee wrap compression', 'Ice pack application'],
        otc: ['Ibuprofen', 'Naproxen', 'Diclofenac gel'],
        followUps: ['Recent injury?', 'Able to bear weight?', 'Locked?', 'Swollen?']
      },
      Swelling: {
        descriptors: ['Localized swelling', 'Whole knee', 'Warm', 'Stiff', 'Fluid sensation'],
        associated: ['Clicking', 'Locking', 'Instability', 'Pain walking'],
        triggers: ['Walking', 'Running', 'Stairs', 'Squatting'],
        relievers: ['Elevation', 'Ice', 'Knee sleeve Support', 'Rest'],
        otc: ['Ibuprofen', 'Naproxen'],
        followUps: ['Able to bend?', 'Fever present?']
      }
    }
  },
  shin: {
    complaints: {
      Pain: {
        descriptors: ['Aching shin bone', 'Shin splint tender line', 'Sharp load pinch'],
        associated: ['Lower leg tightness', 'Calf fatigue', 'Ankle flex restriction'],
        triggers: ['Running on hard concrete', 'Jumping', 'Walking uphill'],
        relievers: ['Ice massage', 'Leg elevation rest', 'Compression socks'],
        otc: ['Ibuprofen', 'Diclofenac gel'],
        followUps: ['Worse in the morning?', 'Shin tender to touch?']
      }
    }
  },
  calf: {
    complaints: {
      Pain: {
        descriptors: ['Calf tightness cramp', 'Aching knot pull', 'Heavy vascular congestion'],
        associated: ['Foot sole tingling', 'Ankle stiffness', 'Leg numbness'],
        triggers: ['Standing hours', 'Flexing ankle', 'Walking uphill'],
        relievers: ['Gently stretching calf', 'Elevating legs', 'Warm water spray'],
        otc: ['Paracetamol', 'Ibuprofen'],
        followUps: ['Sudden nighttime cramp?', 'One-sided swelling?']
      }
    }
  },
  ankle: {
    complaints: {
      Pain: {
        descriptors: ['Sharp lateral twist pressure', 'Dull sprain tendon pull', 'Tender joint bone'],
        associated: ['Swelling outer skin', 'Foot clicking', 'Instability twisting'],
        triggers: ['Weight bearing', 'Rotating foot', 'Walking uneven floor'],
        relievers: ['Ice therapy (R.I.C.E)', 'Ankle brace splint', 'Elevating foot'],
        otc: ['Ibuprofen', 'Naproxen', 'Diclofenac gel'],
        followUps: ['Able to bear weight?', 'Recent twist injury?']
      }
    }
  },
  heel: {
    complaints: {
      Pain: {
        descriptors: ['Plantar fascia heel stab', 'Sharp bruise print', 'Aching tendon bottom'],
        associated: ['Morning foot stiffness', 'Foot arch strain', 'Limping'],
        triggers: ['Taking first steps morning', 'Barefoot walking', 'Standing too long'],
        relievers: ['Rolling foot on frozen bottle', 'Arch support shoe inserts', 'Calf stretching'],
        otc: ['Ibuprofen', 'Diclofenac gel'],
        followUps: ['Worst in first morning steps?', 'Swollen Achilles tendon?']
      }
    }
  },
  sole: {
    complaints: {
      Pain: {
        descriptors: ['Burning ball', 'Plantar arch cramp', 'Sharp step soreness', 'Numb tingling'],
        associated: ['Toe stiffness', 'Foot heaviness', 'Calf tightening'],
        triggers: ['Running', 'Standing hours', 'Flexible flat shoes'],
        relievers: ['Plantar stretching', 'Comfort cushioned support', 'Foot rest massage'],
        otc: ['Ibuprofen', 'Paracetamol'],
        followUps: ['Tingling or numbness?', 'Cramping arch?']
      }
    }
  },
  foot: {
    complaints: {
      Pain: {
        descriptors: ['Top of foot ache', 'Knuckle toe pinch', 'Dull compression soreness'],
        associated: ['Toes click', 'Ankle fatigue', 'Skin redness'],
        triggers: ['Tight footwear', 'Walking long', 'Flexing foot'],
        relievers: ['Loosening shoes', 'Foot bath wash', 'Elevation rest'],
        otc: ['Paracetamol', 'Ibuprofen'],
        followUps: ['Shoe pressure related?', 'Injury to toes?']
      }
    }
  },

  // Physiological Systems
  respiratory: {
    complaints: {
      Cough: {
        descriptors: ['Dry tickle', 'Wet hacking', 'Productive phlegm', 'Spasmodic', 'Intermittent'],
        associated: ['Fever', 'Chest congestion', 'Sore throat', 'Shortness of breath'],
        triggers: ['Cold air', 'Dust', 'Exercise', 'Pollen', 'Smoke'],
        relievers: ['Steam inhalation', 'Warm fluids', 'Rest', 'Cough drops'],
        otc: ['Dextromethorphan', 'Guaifenesin', 'Acetaminophen'],
        followUps: ['Coughing up blood?', 'Trouble breathing?', 'Fever present?']
      },
      'Shortness of breath': {
        descriptors: ['Air hunger', 'Chest tightness', 'Shallow', 'Rapid breathing'],
        associated: ['Wheezing', 'Chest pain', 'Fatigue', 'Dizziness'],
        triggers: ['Exercise', 'Pollen', 'Cold air', 'Anxiety'],
        relievers: ['Resting upright', 'Pursed-lip breathing', 'Calm environment'],
        otc: ['Acetaminophen'],
        followUps: ['Sudden onset?', 'Chest pain associated?', 'Worse while lying flat?']
      }
    }
  },
  cardiovascular: {
    complaints: {
      Palpitations: {
        descriptors: ['Fluttering', 'Racing', 'Skipped beats', 'Pounding', 'Thumping'],
        associated: ['Dizziness', 'Lightheadedness', 'Shortness of breath', 'Chest discomfort'],
        triggers: ['Stress', 'Caffeine', 'Physical exertion', 'Lack of sleep'],
        relievers: ['Rest', 'Deep breathing', 'Cool hydration'],
        otc: ['Acetaminophen'],
        followUps: ['Chest pain present?', 'Fainting episodes?', 'Dizzy or lightheaded?']
      }
    }
  },
  digestive: {
    complaints: {
      Nausea: {
        descriptors: ['Mild queasiness', 'Severe urge to vomit', 'Constant gagging', 'Comes and goes'],
        associated: ['Bloating', 'Abdominal pain', 'Dizziness', 'Loss of appetite'],
        triggers: ['Food odors', 'Motion', 'Specific foods', 'Empty stomach'],
        relievers: ['Sips of ginger ale', 'Peppermint tea', 'Resting head', 'Cool compress'],
        otc: ['Bismuth subsalicylate', 'Antacid'],
        followUps: ['Vomiting occurred?', 'Fever present?', 'Possibility of pregnancy?']
      }
    }
  },
  neurological: {
    complaints: {
      Dizziness: {
        descriptors: ['Room spinning', 'Lightheaded', 'Off-balance', 'Faint feeling'],
        associated: ['Nausea', 'Blurred vision', 'Headache', 'Weakness'],
        triggers: ['Standing up quickly', 'Turning head', 'Bright lights', 'Dehydration'],
        relievers: ['Lifting legs while lying down', 'Hydration', 'Sitting down immediately'],
        otc: ['Meclizine', 'Acetaminophen'],
        followUps: ['Fainted?', 'Speech changes?', 'Numbness or tingling?']
      }
    }
  },
  urinary: {
    complaints: {
      'Painful urination': {
        descriptors: ['Burning sensation', 'Sticking pain', 'Aching pressure'],
        associated: ['Frequent urination', 'Urgency', 'Cloudy urine', 'Lower back pain'],
        triggers: ['Dehydration', 'Caffeine', 'Holding urine too long'],
        relievers: ['Hydration', 'Warm bath', 'Resting'],
        otc: ['Phenazopyridine', 'Acetaminophen'],
        followUps: ['Fever present?', 'Blood in urine?']
      }
    }
  },
  mental_health: {
    complaints: {
      Anxiety: {
        descriptors: ['Overwhelming panic', 'Restlessness', 'Constant worry', 'Tense muscles'],
        associated: ['Heart racing', 'Shortness of breath', 'Sleep issues', 'Sweaty palms'],
        triggers: ['Work stress', 'Crowds', 'Caffeine', 'Fatigue'],
        relievers: ['Deep breathing', 'Quiet space', 'Walking', 'Grounding techniques'],
        otc: ['Acetaminophen'],
        followUps: ['Affecting daily work?', 'Panic attacks?']
      }
    }
  },
  general: {
    complaints: {
      Fatigue: {
        descriptors: ['Bone-tired exhaustion', 'Lethargy', 'Heavy body', 'Brain fog', 'Morning fatigue'],
        associated: ['Body aches', 'Sleep issues', 'Headache', 'Mood changes'],
        triggers: ['Lack of sleep', 'Stress', 'Physical exertion', 'Skipping meals'],
        relievers: ['Sleep', 'Rest', 'Hydration', 'Short walk', 'Relaxing warm bath'],
        otc: ['Multivitamin', 'Acetaminophen'],
        followUps: ['Fever present?', 'Unexplained weight changes?']
      }
    }
  },
  skin: {
    complaints: {
      Rash: {
        descriptors: ['Itchy small bumps', 'Red scaling patch', 'Dry flaky raised', 'Blistered lines'],
        associated: ['Warm skin surface', 'Local swelling', 'Peeling skin'],
        triggers: ['Scented soaps', 'Sweat heat', 'Scratching', 'Allergen triggers'],
        relievers: ['Cold wet pack', 'Gentle hydration lotion', 'Oatmeal bath soak'],
        otc: ['Hydrocortisone cream', 'Loratadine antihistamine'],
        followUps: ['Spreading rapidly?', 'Fever present?', 'Painful?']
      }
    }
  },
  musculoskeletal: {
    complaints: {
      'Joint pain': {
        descriptors: ['Aching stiffness', 'Sharp flex pinch', 'Throbbing deep joint', 'Constant weariness'],
        associated: ['Warm joint area', 'Clicking sound', 'Stiffness', 'Limited movement'],
        triggers: ['Exercise', 'Changes in weather', 'Standing hours', 'Cold temperatures'],
        relievers: ['Warm pack', 'Joint rest', 'Gentle stretching exercises'],
        otc: ['Ibuprofen', 'Naproxen', 'Diclofenac gel'],
        followUps: ['Swollen?', 'Injury related?']
      }
    }
  },

  // System Fallback Generic Node
  generic: {
    complaints: {
      Pain: {
        descriptors: ['Dull ache', 'Sharp', 'Throbbing', 'Soreness', 'Constant stiffness', 'Mild discomfort'],
        associated: ['Fatigue', 'Sleep issues', 'Mild stiffness', 'General fatigue'],
        triggers: ['Movement', 'Physical effort', 'Stress', 'Sitting too long'],
        relievers: ['Rest', 'Stretching', 'Hydration', 'Warm Shower'],
        otc: ['Paracetamol', 'Ibuprofen'],
        followUps: ['Does movement make it worse?', 'Is this symptom new?', 'Does resting help?']
      }
    }
  }
};

/**
 * Centered evaluation engine to get current interview questions, options and data profiles
 */
export const getInterviewNode = (
  bodyRegion: string | undefined,
  subRegionName: string | undefined,
  complaintName: string | undefined,
  previousAnswers: any
): InterviewNode => {
  const step = previousAnswers.step ?? 1;

  // 1. Resolve normalized profile key
  let profileKey = 'generic';
  if (previousAnswers.bodySystem) {
    profileKey = normalizeSubRegionKey(previousAnswers.bodySystem);
  } else if (subRegionName) {
    profileKey = normalizeSubRegionKey(subRegionName);
  } else if (previousAnswers.subRegions && previousAnswers.subRegions.length > 0) {
    profileKey = normalizeSubRegionKey(previousAnswers.subRegions[0]);
  }

  // 2. Fetch specific database profile
  const profile = medicalKnowledge[profileKey] || medicalKnowledge['generic'];
  
  // 3. Fetch specific complaint (symptom) data (Pain is default)
  const complaintKey = complaintName || previousAnswers.symptom || Object.keys(profile.complaints)[0] || 'Pain';
  const symptomData = profile.complaints[complaintKey] || 
                     profile.complaints['Pain'] || 
                     medicalKnowledge['generic'].complaints['Pain'];

  // 4. Determine title, options and type depending on step state
  let title = '';
  let options: string[] = [];
  let type: InterviewNode['type'] = 'select-complaint';
  let isComplete = false;

  switch (step) {
    case 1:
      const regionObj = BODY_REGIONS.find((r) => r.id === bodyRegion);
      title = `Which part of the ${regionObj?.name || 'body'} is affected?`;
      options = regionObj ? regionObj.subRegions.map((sr) => sr.name) : [];
      type = 'select-subregions';
      break;
    case 2:
      title = 'What core symptom are you experiencing today?';
      options = Object.keys(profile.complaints);
      type = 'select-complaint';
      break;
    case 3:
      title = 'How would you describe it?';
      options = symptomData.descriptors;
      type = 'select-descriptor';
      break;
    case 4:
      title = 'Rate the severity';
      options = Array.from({ length: 11 }, (_, i) => i.toString());
      type = 'severity';
      break;
    case 5:
      title = 'When did it begin?';
      options = ['Just now', 'Today', 'Yesterday', 'Few days', 'Week', 'Month'];
      type = 'onset';
      break;
    case 6:
      title = 'How often does it occur?';
      options = ['Constant', 'Comes and goes', 'Random', 'Morning', 'Evening', 'Night'];
      type = 'frequency';
      break;
    case 7:
      title = 'What impacts it?';
      options = []; 
      type = 'triggers-relievers';
      break;
    case 8:
      title = 'Did you take medicine & did it help?';
      options = []; 
      type = 'medication';
      break;
    case 9:
      const hasFollowUps = symptomData.followUps && symptomData.followUps.length > 0;
      title = hasFollowUps ? 'Select associated reactions' : 'Any additional comments?';
      options = hasFollowUps ? symptomData.followUps : symptomData.associated;
      type = 'associated-followup';
      break;
    default:
      isComplete = true;
      break;
  }

  return {
    title,
    options,
    type,
    symptomData,
    isComplete,
  };
};
