# Therapeutic Approaches for Luna

This document provides in-depth explanations of each therapeutic approach that Kalito can use to support users. Each section includes the theory, practical techniques, and ideas for app feature integration.

---

## 1. CBT (Cognitive Behavioral Therapy)

### Core Theory
CBT is based on the idea that our thoughts, feelings, and behaviors are interconnected. Negative thought patterns lead to negative emotions and unhelpful behaviors. By identifying and challenging these patterns, we can change how we feel and act.

**The CBT Triangle:**
```
   Thoughts
    /    \
   /      \
Feelings - Behaviors
```

### Key Concepts

#### Automatic Thoughts
- Immediate, reflexive thoughts that pop up in response to situations
- Often negative, distorted, or unhelpful
- Usually happen so fast we don't notice them

**Example:** Someone doesn't text back → "They hate me" (automatic thought)

#### Cognitive Distortions
Common thinking errors that maintain negative patterns:

1. **All-or-Nothing Thinking**: Seeing things in black and white
   - "If I'm not perfect, I'm a failure"

2. **Catastrophizing**: Expecting the worst possible outcome
   - "If I mess up this presentation, I'll lose my job and become homeless"

3. **Overgeneralization**: One event means everything is always that way
   - "I failed once, so I always fail"

4. **Mental Filter**: Focusing only on negatives, ignoring positives
   - Getting 9/10 positive reviews but only thinking about the 1 negative

5. **Mind Reading**: Assuming you know what others think
   - "They think I'm stupid" (without evidence)

6. **Fortune Telling**: Predicting negative outcomes
   - "I know this won't work out"

7. **Emotional Reasoning**: "I feel it, so it must be true"
   - "I feel worthless, therefore I am worthless"

8. **Should Statements**: Rigid rules about how things "should" be
   - "I should be better at this by now"

9. **Labeling**: Defining yourself by one trait or mistake
   - "I'm a loser" instead of "I made a mistake"

10. **Personalization**: Blaming yourself for things outside your control
    - "It's my fault they're upset"

#### Thought Records
A structured way to examine and challenge thoughts:

1. **Situation**: What happened?
2. **Automatic Thought**: What went through your mind?
3. **Emotion**: What did you feel? How intense (0-100)?
4. **Evidence For**: What supports this thought?
5. **Evidence Against**: What contradicts this thought?
6. **Alternative Thought**: What's a more balanced perspective?
7. **New Emotion**: How do you feel now? Intensity?

### CBT Techniques

#### 1. Cognitive Restructuring
- Identify the distorted thought
- Examine the evidence
- Generate alternative interpretations
- Choose a more balanced thought

**Kalito's Role:**
- "I notice you said [distorted thought]. What evidence do you have for that?"
- "What would you tell a friend who had that thought?"
- "What's another way to look at this situation?"

#### 2. Behavioral Activation
When depressed, we withdraw → which makes depression worse. Behavioral activation breaks this cycle by scheduling positive activities.

**Steps:**
1. Identify activities that bring pleasure or accomplishment
2. Schedule them (even when you don't feel like it)
3. Track completion and mood impact
4. Gradually increase activities

#### 3. Behavioral Experiments
Test whether your fears/beliefs are actually true.

**Example:**
- Belief: "If I go to the party, I'll have a panic attack and embarrass myself"
- Experiment: Go to the party for 30 minutes
- Result: Discover anxiety decreases, or that you can handle it

#### 4. Graded Exposure
For anxiety/phobias - gradually face feared situations in a hierarchy from least to most scary.

#### 5. Problem-Solving
Structured approach to challenges:
1. Define the problem clearly
2. Brainstorm solutions (no judgment)
3. Evaluate pros/cons of each
4. Choose one and try it
5. Evaluate the outcome

### App Integration Ideas

#### Feature: Thought Record Journal
- Guided prompts for each step of a thought record
- Save and review past records to see patterns
- Kalito can help identify cognitive distortions in real-time
- Visualize trends (which distortions you use most)

#### Feature: Cognitive Distortion Detector
- User shares a thought → AI identifies potential distortion
- Educational pop-ups explaining each distortion type
- Challenge exercises specific to that distortion

#### Feature: Behavioral Activation Scheduler
- Activity library (categorized: social, physical, creative, self-care)
- Calendar integration for scheduling
- Mood tracking before/after activities
- Kalito suggests activities based on patterns

#### Feature: Behavioral Experiments Tracker
- Set up experiment with hypothesis
- Track execution and results
- Reflect on what you learned
- Update beliefs based on evidence

#### Feature: Problem-Solving Wizard
- Step-by-step guided problem-solving
- Brainstorm mode (voice input to quickly capture ideas)
- Decision matrix for evaluating options
- Follow-up reminders to check how solution worked

---

## 2. DBT (Dialectical Behavior Therapy)

### Core Theory
DBT was developed by Marsha Linehan specifically for people with intense emotional experiences (originally for borderline personality disorder, now used widely). It combines acceptance (you're doing your best) with change (you need to learn new skills).

**The Dialectic:** Accepting yourself as you are WHILE working to change.

### The Four Modules

---

### Module 1: Mindfulness (The Foundation)

**What it is:** Being fully present in the current moment without judgment.

**Core Skills:**

#### Observe
- Notice without describing or labeling
- Watch thoughts/emotions/sensations come and go
- Like sitting by a river, watching leaves float by

#### Describe
- Put words to what you observe
- "I'm having the thought that..."
- "I notice tightness in my chest"
- Facts only, no judgments

#### Participate
- Fully engage in the current activity
- Lose self-consciousness
- Be one with the experience

#### Non-Judgmental Stance
- Stop labeling things as "good" or "bad"
- Replace judgments with descriptions
- Notice when you judge, then return to observing

#### One-Mindfully
- Do one thing at a time with full attention
- When your mind wanders, gently return
- No multitasking

#### Effectively
- Focus on what works, not what's "fair"
- Do what's needed in this situation
- Let go of "should" and "right/wrong"

**Mindfulness Exercises:**
- Body scan
- Breath counting
- Five senses grounding (5 things you see, 4 hear, 3 touch, 2 smell, 1 taste)
- Walking meditation
- Eating meditation

---

### Module 2: Distress Tolerance

**What it is:** Skills to survive crises without making things worse.

**When to use:** When emotions are so intense that problem-solving isn't possible yet.

#### STOP Skill (Crisis Response)
- **S**top: Freeze, don't react immediately
- **T**ake a step back: Get space from the situation
- **O**bserve: Notice what's happening inside and outside
- **P**roceed mindfully: Choose wise action

#### TIP Skill (Emergency Emotion Regulation)
- **T**emperature: Change your body temperature (ice on face, cold shower)
- **I**ntense exercise: Burn off adrenaline (run, jump, push-ups)
- **P**aced breathing: Slow exhales longer than inhales

#### ACCEPTS (Distraction)
- **A**ctivities: Engage in something absorbing
- **C**ontributing: Help someone else
- **C**omparisons: Compare to times you've coped worse or others' struggles
- **E**motions: Do something that creates opposite emotion (comedy for sadness)
- **P**ushing away: Mentally shelve the problem for now
- **T**houghts: Engage your mind (puzzles, count backwards)
- **S**ensations: Strong sensations (hold ice, squeeze stress ball, loud music)

#### IMPROVE (Make the Moment Better)
- **I**magery: Visualize peaceful scene or coping effectively
- **M**eaning: Find purpose in the suffering
- **P**rayer: Connect to something greater (spiritual or not)
- **R**elaxation: Progressive muscle relaxation, breathing
- **O**ne thing in the moment: Focus on present, not past/future
- **V**acation: Brief mental or physical break
- **E**ncouragement: Self-affirmations, cheerleading

#### Radical Acceptance
- Accepting reality as it is (not approving, just acknowledging)
- Suffering = Pain × Resistance
- When you stop fighting reality, you can respond effectively
- "It is what it is"

#### Willingness vs. Willfulness
- **Willingness**: Doing what's needed, even if hard
- **Willfulness**: Refusing to accept, trying to control what you can't

---

### Module 3: Emotion Regulation

**What it is:** Understanding and managing emotions effectively.

#### Understanding Emotions

**What Emotions Do:**
1. Communicate to ourselves (alert us to needs)
2. Communicate to others (facial expressions)
3. Motivate action (prepare us to respond)

**Emotion Model:**
```
Prompting Event → Interpretation → 
Biological Response + Facial Expression + Action Urge → Emotion Name
```

#### Identifying Emotions
- **Primary emotions**: First reaction (often adaptive)
- **Secondary emotions**: Reaction to the primary (shame about anger, anxiety about sadness)

#### Check the Facts
- Examine the interpretation, not just the emotion
- Is your interpretation accurate?
- Does the intensity fit the facts?
- What's the worst/best/most likely outcome?

#### Opposite Action
When emotion doesn't fit the facts OR acting on it would be harmful:

- **Fear** (avoid) → Approach what you're afraid of
- **Sadness** (withdraw) → Get active, reach out
- **Anger** (attack) → Gently avoid, think kind thoughts
- **Shame** (hide) → Share, make eye contact
- **Guilt** (apologize repeatedly) → Do nothing, move forward

#### Problem Solving
When emotion DOES fit the facts:
1. Describe the problem
2. Check if it's solvable now
3. Identify goal
4. Brainstorm solutions
5. Choose and implement
6. Evaluate results

#### ABC PLEASE (Reduce Vulnerability)
Build resilience so emotions are less intense:

**Accumulate Positives:**
- Short-term: Pleasant activities daily
- Long-term: Build a life worth living (values, goals)

**Build Mastery:**
- Do things that make you feel competent
- Learn new skills, tackle challenges

**Cope Ahead:**
- Rehearse for difficult situations
- Practice skills before you need them

**PLEASE:**
- **PL**: Treat physical illness
- **E**: Balanced eating
- **A**: Avoid mood-altering substances
- **S**: Sleep hygiene (consistent schedule)
- **E**: Exercise regularly

---

### Module 4: Interpersonal Effectiveness

**What it is:** Getting what you need in relationships while maintaining self-respect and the relationship.

#### DEAR MAN (Getting What You Want)

**State your request:**
- **D**escribe: State the facts objectively
- **E**xpress: Share your feelings/opinions
- **A**ssert: Ask clearly for what you want
- **R**einforce: Explain positive effects of compliance

**Stay effective:**
- **M**indful: Stay focused on goal, ignore distractions
- **A**ppear confident: Eye contact, steady voice (even if nervous)
- **N**egotiate: Be willing to compromise

#### GIVE (Maintaining Relationships)

- **G**entle: No attacks, threats, or judgments
- **I**nterested: Listen, don't interrupt, validate
- **V**alidate: Acknowledge their perspective
- **E**asy manner: Smile, be light-hearted, use humor

#### FAST (Keeping Self-Respect)

- **F**air: Be fair to yourself and others
- **A**pologies: No over-apologizing
- **S**tick to values: Don't compromise integrity
- **T**ruthful: No lies, no exaggeration

#### Validation Levels
1. Be present (put down phone, make eye contact)
2. Accurate reflection ("So you're saying...")
3. Read emotions ("You seem frustrated")
4. Understand causes ("That makes sense because...")
5. Acknowledge the valid ("Anyone would feel that way")
6. Radical genuineness (treat as equal, be authentic)

### App Integration Ideas

#### Feature: DBT Skills Library
- Organized by module
- Quick-access crisis cards (STOP, TIP, ACCEPTS)
- Video/audio guided exercises
- Skill tracking (which skills you use, effectiveness ratings)

#### Feature: Distress Tolerance Toolbox
- Crisis plan (personalized STOP script)
- ACCEPTS menu with custom activities
- Timer for TIP skills (paced breathing, exercise duration)
- Emergency contacts quick dial

#### Feature: Emotion Tracker
- Log emotions with intensity
- Identify prompting events
- Check the facts prompts
- Opposite action suggestions
- Visualize emotion patterns over time

#### Feature: PLEASE Tracker
- Daily check-ins for physical illness, eating, sleep, exercise
- Streak tracking
- Insights on emotion intensity vs. PLEASE adherence

#### Feature: Interpersonal Scripts
- Choose situation type (request, boundary, conflict)
- Build DEAR MAN/GIVE/FAST script
- Practice mode (voice recording)
- Post-interaction reflection

#### Feature: Mindfulness Timer
- Guided meditations (observe, describe, participate)
- Bell reminders for one-mindful practice
- Daily mindfulness challenges

---

## 3. ACT (Acceptance and Commitment Therapy)

### Core Theory
ACT focuses on psychological flexibility: being present, accepting what's out of your control, and committing to actions aligned with your values.

**ACT's Goal:** Not to eliminate difficult emotions, but to live a meaningful life despite them.

### The Six Core Processes

---

### 1. Cognitive Defusion

**The Problem:** Fusion with thoughts - treating thoughts as literal truth, commands, or threats.

**Examples of Fusion:**
- "I'm having the thought 'I'm worthless'" becomes "I AM worthless"
- Believing thoughts = facts
- Obeying thought commands ("Don't go to the party")
- Fighting with thoughts (trying to suppress them)

**The Solution:** Create distance between you and your thoughts.

**Defusion Techniques:**

#### "I'm having the thought that..."
- Transform: "I'm stupid" → "I'm having the thought that I'm stupid"
- Creates observer perspective

#### Name the Story
- "Ah, there's the 'I'm not good enough' story again"
- Recognize repetitive thought patterns

#### Thank Your Mind
- "Thanks mind, I know you're trying to protect me"
- Acknowledge without obeying

#### Silly Voices
- Say the thought in a cartoon character voice
- Sing it to "Happy Birthday"
- Makes the thought lose its power

#### Leaves on a Stream
- Visualize thoughts as leaves floating down a stream
- Watch them drift by without grabbing them

#### Thoughts as Text
- Imagine the thought written on a sign, or scrolling on a screen
- See the thought as an object, not truth

---

### 2. Acceptance

**The Problem:** Experiential avoidance - trying to escape or control uncomfortable thoughts/feelings.

**The Paradox:** The more you struggle against pain, the more it persists.
- "Don't think about pink elephants" → You think about pink elephants

**The Solution:** Make room for discomfort without struggle.

**Acceptance ≠ Resignation**
- Not giving up or liking the pain
- Choosing to feel it rather than fight it
- Creates energy for valued action

**Acceptance Techniques:**

#### Expansion
- Notice where the feeling is in your body
- Breathe into it
- Make space for it, let it be

#### Urge Surfing
- Treat cravings/urges like ocean waves
- They rise, peak, and fall naturally
- You don't have to act on them

#### Willingness
- Ask: "Am I willing to feel this in service of what matters?"
- Open hands gesture (vs. clenched fists of control)

---

### 3. Contact with Present Moment (Mindfulness)

**The Problem:** Living in past (rumination) or future (worry), missing your life NOW.

**The Solution:** Flexible attention to here-and-now experience.

**Present Moment Practices:**
- Five senses grounding
- Notice thoughts coming and going
- Describe your environment
- "What am I experiencing right now?"

---

### 4. Self-as-Context (Observer Self / Sky as Context)

**The Problem:** Over-identification with thoughts, feelings, roles, labels.
- "I AM my anxiety"
- "I AM a failure"

**The Metaphor: Sky as Context**

Imagine your consciousness as the sky:
- **Thoughts/Emotions** = Weather (clouds, storms, sunshine)
- **Observing Self** = The sky itself

Key insights:
- The sky contains all weather but isn't damaged by it
- Storms pass, clouds move, but sky remains constant
- You can observe "I'm experiencing anxiety" from the still point of the observer

**The Observer Self:**
- The "you" that has always been there
- The continuous awareness watching your life
- Not your thoughts, emotions, body, or roles
- The context that holds all experiences

**Exercises:**

#### Observer Meditation
- Notice you're noticing thoughts
- Who is the one observing?
- You are not the content, you are the space

#### Continuous You
- Remember being 5 years old → teenager → now
- Your experiences changed, but "you" were always there
- That continuous awareness is observer self

#### "I am not my..."
- I am not my thoughts (they come and go, I remain)
- I am not my emotions (they pass, I'm still here)
- I am not my body (it changes, I observe it)
- I am not my roles (I have many, but I'm the observer)

---

### 5. Values

**The Problem:** Living on autopilot, driven by fear or others' expectations.

**The Solution:** Clarify what truly matters to you, then orient life toward it.

**Values vs. Goals:**
- **Goal**: Lose 20 pounds (achievable, then done)
- **Value**: Health, vitality (ongoing direction)
- Goals serve values

**Life Domains:**
1. Relationships (family, romantic, friendships)
2. Work/Career
3. Education/Personal Growth
4. Recreation/Leisure
5. Spirituality
6. Community/Citizenship
7. Health/Physical Well-being
8. Environment/Nature

**Values Clarification Questions:**
- What do you want your life to stand for?
- At your funeral, what do you want said about you?
- When you're 90, what will you be glad you did?
- What would you do if fear wasn't a factor?
- What makes you feel alive?

**Values Bullseye:**
- Identify key values
- Rate how consistently you live them (0-10)
- Identify specific actions that align

---

### 6. Committed Action

**The Problem:** Knowing your values but not acting on them.

**The Solution:** Take concrete steps toward valued life, even when uncomfortable.

**SMART Goals:**
- **S**pecific: Clearly defined
- **M**easurable: Can track progress
- **A**chievable: Realistic
- **R**elevant: Connects to values
- **T**ime-bound: Has a deadline

**Barriers to Action:**
- Fusion with "I can't" thoughts
- Avoidance of discomfort
- Lack of skills
- Overwhelm

**Committed Action Process:**
1. Choose a value domain
2. Identify a specific value
3. Set a goal aligned with that value
4. Break into tiny steps
5. Commit to first step
6. Notice barriers (thoughts/feelings)
7. Use defusion/acceptance to make room
8. Take action anyway
9. Reflect and adjust

**Willingness:**
- "I'm willing to feel anxious to connect with others" (social value)
- "I'm willing to feel frustrated to learn this skill" (growth value)

---

### The ACT Hexaflex (How It All Works Together)

```
        Present Moment
              |
    Acceptance  —  Defusion
              |
         Values
              |
  Committed Action — Self-as-Context
```

**Psychological Flexibility** = Being present + accepting + defused + connected to values + taking committed action + from observer perspective

### App Integration Ideas

#### Feature: Defusion Toolbox
- Quick defusion exercises (silly voice recorder, leaves visualization)
- "Name that story" - track recurring thought patterns
- "Thank your mind" practice prompts

#### Feature: Values Compass
- Guided values clarification exercises
- Values bullseye visualization (rate alignment)
- Life domains assessment
- "Why am I here?" journal prompts

#### Feature: Committed Action Planner
- Link goals to specific values
- Break goals into micro-steps
- Track barriers (thoughts/feelings that showed up)
- Willingness statements ("I'm willing to feel ___ to do ___")
- Celebrate values-aligned actions

#### Feature: Observer Self Meditation
- Guided meditations for self-as-context
- Sky as context visualization
- Continuous self exercise
- "I am not my..." practice

#### Feature: Acceptance Practice
- Expansion exercises (breath into discomfort)
- Urge surfing timer and guided practice
- Willingness vs. willfulness check-ins
- Track what you're making room for

#### Feature: ACT in Action Dashboard
- Visualize hexaflex with your current state
- Daily check-ins for each process
- Insights on which processes need attention

---

## 4. Mindfulness

### Core Theory
Mindfulness is paying attention, on purpose, in the present moment, without judgment (Jon Kabat-Zinn). It's the foundation of many therapeutic approaches.

**Two Components:**
1. **Attention regulation**: Training focus on present
2. **Attitude**: Approaching experience with curiosity, openness, acceptance

### Key Concepts

#### Automatic Pilot vs. Mindful Awareness
- **Automatic**: Going through motions, lost in thought
- **Mindful**: Fully present, aware of experience

#### Beginner's Mind
- Experiencing each moment as if for the first time
- Dropping assumptions and expectations
- Curious about the ordinary

#### Non-Judgment
- Observing without labeling as good/bad
- Noticing judgments, then returning to observing
- Acceptance of what is

#### Non-Striving
- Being, not doing
- Not trying to achieve or fix
- Allowing experience to unfold

### Types of Mindfulness Practice

---

### Formal Practice (Dedicated Time)

#### 1. Breath Awareness
**How:**
- Sit comfortably
- Focus attention on breath (nose, chest, belly)
- When mind wanders (it will), gently return to breath
- No judgment when you notice wandering

**Duration:** 5-20 minutes

**Benefits:**
- Trains attention
- Calms nervous system
- Creates mental space

#### 2. Body Scan
**How:**
- Lie down or sit
- Systematically move attention through body parts
- Notice sensations without changing them
- Breathe into areas of tension

**Route:** Toes → feet → legs → hips → belly → chest → arms → hands → neck → face → head

**Duration:** 10-45 minutes

**Benefits:**
- Body awareness
- Releases tension
- Grounds in present

#### 3. Sitting Meditation
**How:**
- Start with breath as anchor
- Expand to sounds, sensations, thoughts
- Notice everything that arises
- Keep returning to present when lost in thought

**Duration:** 10-60 minutes

#### 4. Walking Meditation
**How:**
- Walk slowly and deliberately
- Notice lifting, moving, placing each foot
- Feel sensations in legs, feet, body
- If mind wanders, return to walking

**Pace:** Very slow to normal walking speed

**Benefits:**
- Mindfulness in motion
- Good for restlessness
- Portable practice

#### 5. Loving-Kindness (Metta)
**How:**
- Generate feelings of warmth/kindness
- Direct toward: yourself → loved one → neutral person → difficult person → all beings
- Use phrases: "May I/you be happy, healthy, safe, peaceful"

**Duration:** 10-30 minutes

**Benefits:**
- Cultivates compassion
- Reduces self-criticism
- Improves relationships

---

### Informal Practice (Everyday Mindfulness)

#### Mindful Eating
- Eat without screens/distractions
- Notice colors, textures, smells
- Chew slowly, taste fully
- Awareness of hunger/fullness

#### Mindful Listening
- Full attention on speaker
- Notice urge to interrupt or plan response
- Listen to understand, not reply

#### Mindful Showering
- Feel water temperature, pressure
- Notice soap texture, scent
- Sensations of drying off

#### Mindful Walking
- Feel feet on ground
- Notice body movement
- Observe surroundings

#### STOP Practice
Throughout day, pause to:
- **S**top
- **T**ake a breath
- **O**bserve (thoughts, feelings, sensations)
- **P**roceed

### Common Challenges

#### "My mind won't stop thinking"
- That's normal! Mind's job is to think
- Goal isn't blank mind, it's noticing thoughts
- Each time you notice wandering = success, not failure

#### "I'm doing it wrong"
- No wrong way to be present
- Whatever arises IS the practice
- Judgment about practice is just another thought to notice

#### "I don't have time"
- Start with 2 minutes
- Informal practice counts
- It's not extra task, it's how you do existing tasks

#### "It's not working"
- Not about feeling different immediately
- Benefits are cumulative and subtle
- Practicing regularly is "working"

### App Integration Ideas

#### Feature: Meditation Timer
- Customizable durations
- Interval bells for body scan
- Background sounds (rain, silence, bells)
- Meditation streak tracking

#### Feature: Guided Meditations Library
- Categorized: breath, body scan, sitting, walking, loving-kindness
- Beginner to advanced
- Various teachers/voices
- Downloadable for offline

#### Feature: Mindful Moments
- Random prompts throughout day for STOP practice
- Quick 1-minute exercises
- Mindful activity suggestions (eating, walking, listening)

#### Feature: Meditation Journal
- Post-practice reflections
- Notice patterns (time of day, duration, quality)
- Track mood before/after
- Insights over time

#### Feature: Beginner's Journey
- 7-day, 14-day, 30-day programs
- Progressive introduction to different practices
- Daily reminders
- Educational content

---

## 5. Somatic Practices (Body-Based Approaches)

### Core Theory
Trauma and stress are stored in the body, not just the mind. Somatic practices work directly with bodily sensations, posture, movement, and the nervous system to release tension and regulate emotions.

**Key Insight:** You can't think your way out of a dysregulated nervous system. The body needs to feel safe first.

### The Nervous System

#### Polyvagal Theory (Stephen Porges)

**Three States:**

1. **Ventral Vagal (Social Engagement)**
   - Safe and connected
   - Calm, present, able to connect
   - Optimal state for daily life

2. **Sympathetic (Fight or Flight)**
   - Perceives threat
   - Activated: racing heart, tense muscles, hypervigilance
   - Mobilized for action

3. **Dorsal Vagal (Freeze/Shutdown)**
   - Perceives life threat
   - Numb, disconnected, depersonalized
   - Collapse/immobilization

**Nervous System Ladder:**
```
Ventral (Safe & Social) ← Goal
        ↕
Sympathetic (Fight/Flight)
        ↕
Dorsal (Shutdown/Freeze)
```

**Goal:** Learn to recognize state and use tools to climb back to ventral.

### Somatic Awareness

#### Body Sensations
Learn to notice and name physical experiences:
- Temperature (warm, cold)
- Pressure (tight, open, constricted)
- Texture (smooth, rough, prickly)
- Movement (flowing, stuck, trembling)
- Intensity (light, strong, overwhelming)

#### The Window of Tolerance

```
Hyperarousal (too much activation)
    ↑
Window of Tolerance (optimal zone)
    ↓
Hypoarousal (too little activation)
```

**Goal:** Expand window, return to it when dysregulated.

### Somatic Techniques

---

### 1. Grounding

**Purpose:** Anchor to present moment through body and environment.

#### 5-4-3-2-1 Technique
- **5** things you can see
- **4** things you can touch
- **3** things you can hear
- **2** things you can smell
- **1** thing you can taste

#### Physical Grounding
- Feel feet on floor, weight in chair
- Press hands together
- Hold a cold object (ice, frozen orange)
- Stomp feet
- Touch different textures

#### Orienting
- Slowly look around room
- Name objects you see
- Remind yourself: "I'm here, I'm safe, it's [date/time]"

---

### 2. Breathwork

**Purpose:** Directly influence nervous system through breath.

#### Diaphragmatic Breathing (Belly Breathing)
- Hand on belly, hand on chest
- Inhale deeply, belly expands (chest stays still)
- Exhale fully, belly falls
- Slows heart rate, activates rest-and-digest

#### Box Breathing (4-4-4-4)
- Inhale for 4 counts
- Hold for 4 counts
- Exhale for 4 counts
- Hold for 4 counts
- Repeat

**Used by:** Navy SEALs, first responders

#### Physiological Sigh
- Two inhales through nose (one deep, one top-off)
- Long exhale through mouth
- Fastest way to calm arousal

#### 4-7-8 Breath
- Inhale through nose for 4
- Hold for 7
- Exhale through mouth for 8
- Sedating, good for sleep

---

### 3. Progressive Muscle Relaxation (PMR)

**Purpose:** Release tension by tensing then relaxing muscle groups.

**How:**
1. Tense a muscle group for 5-7 seconds (not painfully)
2. Release suddenly
3. Notice the difference
4. Breathe and relax for 10-20 seconds
5. Move to next group

**Sequence:**
Hands → Arms → Shoulders → Neck → Face → Chest → Stomach → Legs → Feet

**Duration:** 10-20 minutes

**Benefits:**
- Body awareness
- Releases chronic tension
- Improves sleep

---

### 4. Bilateral Stimulation

**Purpose:** Process trauma, calm nervous system (used in EMDR therapy).

#### Butterfly Hug
- Cross arms over chest
- Hands on opposite shoulders
- Alternate tapping left-right
- Slow, rhythmic

#### Side-to-Side Movements
- Eye movements (follow finger left-right)
- Walking
- Drumming alternating hands
- Tapping knees alternately

**Why it works:** Engages both brain hemispheres, integrates experience.

---

### 5. Vagal Toning

**Purpose:** Strengthen ventral vagal nerve, increase regulation capacity.

#### Humming/Singing
- Vibrations stimulate vagus nerve
- Sing out loud, hum a tune
- Ohm chanting

#### Cold Exposure
- Splash cold water on face
- Hold ice cubes
- Cold shower
- Activates vagus nerve

#### Gargling
- Vigorous gargling with water
- Stimulates vagus through throat

#### Social Connection
- Eye contact
- Smiling
- Warm conversation
- Laughter

---

### 6. Pendulation

**Purpose:** Move between activation and calm to expand tolerance.

**How:**
- Notice area of tension/distress in body
- Locate area that feels neutral or pleasant
- Shift attention between them
- Teaches nervous system: "I can feel this AND be okay"

---

### 7. Titration

**Purpose:** Process difficult experiences in small, manageable doses.

**How:**
- Visit edge of difficult sensation/memory
- Don't flood yourself
- Pull back to resource (safe place, breath)
- Gradually increase exposure

**Like:** Dipping toe in water, not jumping into deep end

---

### 8. Shaking/Tremoring

**Purpose:** Release trapped activation (animals do this after threat).

**How:**
- Stand and gently shake hands, arms
- Progress to whole body bouncing/shaking
- Let body move how it wants
- 5-10 minutes

**Used in:** Trauma Release Exercises (TRE)

---

### 9. Body Scan for Emotion

**Purpose:** Locate where emotions live in body.

**How:**
1. Notice emotion (anxiety, sadness, anger)
2. Find it in your body (chest tight, stomach churning)
3. Observe without changing it
4. Breathe into that area
5. Notice if it shifts

**Insight:** Emotions are physical experiences, not just mental.

---

### 10. Resourcing

**Purpose:** Build internal sense of safety and capacity.

#### Safe Place Visualization
- Imagine real or imaginary safe place
- Notice details (sights, sounds, smells)
- Feel safety in body
- Return to this when distressed

#### Resource Library
- Memories of feeling strong, calm, loved
- Supportive people
- Positive qualities you possess
- Access when needed

---

### Somatic Therapy Approaches

#### Somatic Experiencing (Peter Levine)
- Focus on body sensations
- Complete survival responses (fight/flight/freeze)
- Release trapped energy

#### Sensorimotor Psychotherapy
- Mindful awareness of body in present
- Track sensations, impulses, movements
- Process trauma through body

#### Hakomi
- Mindfulness-based
- Track body's "truth signals"
- Gentle exploration of core beliefs

### App Integration Ideas

#### Feature: Grounding Toolkit
- Quick access to 5-4-3-2-1
- Orienting reminders
- Physical grounding exercises
- Track which techniques work best

#### Feature: Breathwork Library
- Guided audio for each technique
- Visual guides (inhale/exhale timing)
- Track sessions and notice patterns
- Emergency breath (one-tap quick access)

#### Feature: PMR Guide
- Muscle group sequence with timer
- Audio instructions
- Progress tracking
- Bedtime routine integration

#### Feature: Nervous System Tracker
- Check-in: Which state am I in?
- Visual ladder (dorsal → sympathetic → ventral)
- Suggested practices based on state
- Pattern recognition over time

#### Feature: Body Sensation Vocabulary
- Help users name what they feel
- Body map (tap area to log sensation)
- Track how emotions show up physically
- Pendulation practice tool

#### Feature: Somatic Exercises Video Library
- Shaking/tremoring demos
- Bilateral stimulation guides
- Vagal toning practices
- Movement-based regulation

#### Feature: Resource Building
- Create safe place visualization
- Record personal resources
- Quick access when distressed
- Add photos, sounds, descriptions

---

## Integration: Combining Approaches

### When to Use What

#### High Distress/Crisis
1. **Somatic**: Grounding, breathwork (regulate nervous system)
2. **DBT**: STOP, TIP, ACCEPTS (survive without making worse)
3. **Mindfulness**: Present moment awareness (reduce overwhelm)

#### Working Through Difficult Emotions
1. **Mindfulness**: Notice and name the emotion
2. **Somatic**: Feel where it lives in body
3. **ACT**: Make room for it (acceptance)
4. **DBT**: Check the facts, opposite action (if needed)
5. **CBT**: Examine thoughts fueling it

#### Persistent Negative Thinking
1. **CBT**: Identify cognitive distortions, thought records
2. **ACT**: Defusion techniques
3. **Mindfulness**: Observe thoughts without engaging

#### Building a Meaningful Life
1. **ACT**: Values clarification, committed action
2. **DBT**: PLEASE, behavioral activation
3. **Somatic**: Build body-based sense of safety

#### Processing Trauma
1. **Somatic**: Titration, pendulation, release activation
2. **ACT**: Self-as-context, acceptance
3. **Mindfulness**: Present moment awareness
4. **DBT**: Distress tolerance during processing

### Creating a Personalized Protocol

**Example: Morning Anxiety**
1. Somatic: 5 minutes grounding + breathwork
2. Mindfulness: Body scan or sitting meditation
3. ACT: Review values, set intention for day
4. DBT: PLEASE check-in (sleep, eating, etc.)
5. CBT: Catch morning thought distortions

**Example: Relationship Conflict**
1. Somatic: Regulate (breathwork, grounding)
2. DBT: DEAR MAN script
3. ACT: Connect to values (what kind of partner do I want to be?)
4. CBT: Check distortions (mind reading, catastrophizing)
5. Mindfulness: Stay present in conversation

---

## Conclusion

These five approaches aren't competing philosophies - they're complementary tools. Luna can help users:

1. **Identify** what they're experiencing (mindfulness, somatic awareness)
2. **Understand** why (CBT, emotion regulation)
3. **Accept** what can't be changed (ACT, radical acceptance)
4. **Regulate** overwhelming states (somatic, DBT distress tolerance)
5. **Navigate** relationships (DBT interpersonal effectiveness)
6. **Live meaningfully** (ACT values and committed action)
7. **Build resilience** (all of the above)

The goal isn't perfection or eliminating all distress - it's psychological flexibility, resilience, and a life worth living.
