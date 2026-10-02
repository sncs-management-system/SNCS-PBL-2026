# SNCS brand and asset audit

## Redesign boundary

This implementation is a redesign of the existing Sto. Niño Catholic School
website, not a rebrand. It retains the school seal, red-and-gold color family,
institutional content, facilities, and alumni presence while improving hierarchy,
navigation, mobile behavior, and CMS readiness.

Reference reviewed: <https://www.sncstaguig.com/>

## Visual direction

- Primary red: `#CC1300`, sampled from the existing website's dominant red
- Supporting deep reds improve contrast in hero and footer areas
- Gold is used as an accent associated with the existing seal and identity
- Cream replaces stark white in large backgrounds to keep the presentation warm
- Typography and spacing are contemporary, but the visual character remains formal,
  Catholic, and community-oriented

## Temporary source-site assets

| Local file | Current use | Provenance |
| --- | --- | --- |
| `sncs-seal.png` | Header identity | Existing public SNCS website |
| `campus-front.jpg` | Home hero | Existing public SNCS website |
| `san-lorenzo-ruiz-building.jpg` | Facility content | Existing public SNCS website |
| `pedro-calungsod-building.jpg` | Facility content | Existing public SNCS website |
| `library.jpg` | Facility content | Existing public SNCS website |
| `alumni-achievers.jpg` | Alumni feature | Existing public SNCS website |
| `genyo-2026-2027.png` | Optional announcement image example | GENYO graphic beside its caption on the [official homepage](https://www.sncstaguig.com/home), retrieved 2 October 2026; 1280 × 632 PNG |

These files are included only to support the approved redesign prototype while the
client's official image library is pending. Before production, the team should:

1. Replace each image with the client-provided original or approved equivalent.
2. Confirm image ownership, usage permission, and final alternative text.
3. Store production media in Supabase Storage and reference it through CMS records.
4. Optimize image dimensions and formats during the content-migration step.

## Preserved public-site subjects

The initial UI intentionally keeps the subjects stakeholders already expect:

- school history and institutional identity;
- mission and vision;
- the values “Simple, Humble, Competent”;
- San Lorenzo Ruiz and Pedro Calungsod buildings;
- the school library and broader campus life;
- alumni achievements;
- public news, advisories, events, and contact channels.

The redesign reorganizes those subjects into focused routes instead of removing
them. Typed publication metadata also prepares every dynamic collection for the
future CMS without coupling the Vue components to a specific API response.
