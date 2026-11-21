import { Link } from 'react-router-dom';
import { CtaBand, FeatureCard, PageHero, Section, StatRow, type Tone } from '@/components/ui';

const PILLARS: { icon: string; title: string; text: string; tone: Tone }[] = [
  {
    icon: 'fas fa-handshake',
    title: 'Dialogue & Mediation',
    text: 'Facilitating constructive conversations between conflicting parties to build understanding and find common ground through impartial mediation processes.',
    tone: 'saffron',
  },
  {
    icon: 'fas fa-users',
    title: 'Community Engagement',
    text: 'Empowering local communities to participate in peace processes and develop sustainable solutions to conflicts that affect their daily lives.',
    tone: 'sage',
  },
  {
    icon: 'fas fa-graduation-cap',
    title: 'Peace Education',
    text: 'Implementing educational programs that teach conflict resolution skills, cultural understanding, and the value of diversity from an early age.',
    tone: 'indigo',
  },
];

const INITIATIVES: { icon: string; title: string; text: string; tone: Tone }[] = [
  {
    icon: 'fas fa-globe-americas',
    title: 'Youth Peace Network',
    text: 'Connecting young leaders from conflict regions to develop cross-cultural understanding and collaborative peace projects.',
    tone: 'sky',
  },
  {
    icon: 'fas fa-balance-scale',
    title: 'Conflict Resolution Training',
    text: 'Providing specialized training in mediation and negotiation techniques to community leaders and officials in high-tension areas.',
    tone: 'gold',
  },
  {
    icon: 'fas fa-microphone',
    title: 'Peace Dialogues',
    text: 'Organizing structured dialogues that bring together diverse voices to address root causes of conflict and build shared visions for peace.',
    tone: 'rose',
  },
];

const STATS = [
  { value: '150+', label: 'Countries engaged' },
  { value: '5,000+', label: 'Trained peacebuilders' },
  { value: '240', label: 'Active projects' },
  { value: '85%', label: 'Conflict resolution success' },
];

const PARTNERS = ['fas fa-university', 'fas fa-hands-helping', 'fas fa-globe', 'fas fa-shield-alt', 'fas fa-hand-holding-heart', 'fas fa-peace'];

/** Peace Building and Global Collaboration (Peace_Building.php). */
export default function PeaceBuildingPage() {
  return (
    <>
      <PageHero
        center
        crumbs={[{ label: 'Peace Building' }]}
        eyebrow="Peace building"
        title="Peace Building and Global Collaboration"
        lead="Promoting dialogue, mediation, and conflict resolution to foster lasting peace and cooperation worldwide."
        actions={
          <a href="#action" className="btn btn-primary btn-lg">
            <i className="fas fa-dove"></i> Become a peacebuilder
          </a>
        }
      />
      <Section id="pillars" eyebrow="Our approach" title="Our peacebuilding pillars" lead="These foundational approaches guide our work in creating sustainable peace and fostering global collaboration.">
        <div className="row g-4">
          {PILLARS.map((p) => (
            <div className="col-md-4" key={p.title}>
              <FeatureCard icon={p.icon} title={p.title} text={p.text} tone={p.tone} />
            </div>
          ))}
        </div>
      </Section>
      <Section id="initiatives" tone="alt" eyebrow="Initiatives" title="Global initiatives" lead="Our programs and projects that actively promote peacebuilding and international collaboration across the world.">
        <div className="row g-4">
          {INITIATIVES.map((p) => (
            <div className="col-md-4" key={p.title}>
              <FeatureCard icon={p.icon} title={p.title} text={p.text} tone={p.tone} />
            </div>
          ))}
        </div>
      </Section>
      <Section id="network" tone="ink" eyebrow="Network" title="Our global network" lead="Building connections across borders to create a worldwide community dedicated to peace and collaboration.">
        <StatRow items={STATS} />
      </Section>
      <Section id="partners" eyebrow="Partners" title="Our partners" lead="Collaborating with organizations worldwide to amplify our impact and create sustainable peace.">
        <div className="row g-3 justify-content-center">
          {PARTNERS.map((icon) => (
            <div className="col-4 col-md-2" key={icon}>
              <div className="card-soft reveal d-flex align-items-center justify-content-center" style={{ aspectRatio: '1' }}>
                <i className={`${icon} fa-2x text-muted`}></i>
              </div>
            </div>
          ))}
        </div>
      </Section>
      <section className="section pt-0" id="action">
        <div className="container">
          <CtaBand
            title="Join the global peace movement"
            lead="Your involvement can make a difference in building a more peaceful and collaborative world for future generations."
            actions={
              <>
                <Link to="/contact" className="btn btn-primary btn-lg">
                  Become a volunteer
                </Link>
                <Link to="/contact" className="btn btn-outline-light btn-lg">
                  Start a local chapter
                </Link>
                <Link to="/contact" className="btn btn-outline-light btn-lg">
                  Donate to our cause
                </Link>
              </>
            }
          />
        </div>
      </section>
    </>
  );
}
