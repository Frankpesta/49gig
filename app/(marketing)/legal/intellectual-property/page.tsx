"use client";

import { PageHero } from "@/components/marketing/page-hero";
import { Copyright } from "lucide-react";

export default function IntellectualPropertyPage() {
  const breadcrumbs = [{ label: "Legal", href: "/legal/terms" }, { label: "Intellectual Property", icon: Copyright }];

  return (
    <div className="w-full">
      <PageHero
        title="Intellectual Property Policy"
        description="Ownership and use of intellectual property on our platform. Last updated: January 6, 2026."
        badge={{ icon: Copyright, text: "Intellectual Property" }}
        breadcrumbs={breadcrumbs}
        imageSrc="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80"
        imageAlt="Intellectual property"
      />

      <section className="py-12 sm:py-16 lg:py-20 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-slate dark:prose-invert prose-lg max-w-none prose-headings:font-semibold prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground">
            <h2>1. Introduction</h2>
            <p>
              This Intellectual Property Policy explains the ownership and use of intellectual property on the 49GIG platform, including platform content, user content, and work product created through freelance projects.
            </p>

            <h2>2. Platform Intellectual Property</h2>
            <h3>2.1 49GIG Ownership</h3>
            <p>
              All content, features, functionality, designs, logos, trademarks, and materials on the 49GIG platform are owned by or licensed to 49GIG and are protected by international copyright, trademark, patent, and other intellectual property laws.
            </p>

            <h3>2.2 Prohibited Use</h3>
            <p>Users may not:</p>
            <ul>
              <li>Copy, modify, or distribute platform content without permission</li>
              <li>Use 49GIG trademarks, logos, or branding without authorization</li>
              <li>Reverse engineer or decompile platform software</li>
              <li>Create derivative works based on the platform</li>
              <li>Remove or alter copyright notices or watermarks</li>
            </ul>

            <h3>2.3 Limited License</h3>
            <p>
              We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the platform for its intended purposes. This license does not include any rights to platform intellectual property.
            </p>

            <h2>3. User Content</h2>
            <h3>3.1 User Retention of Rights</h3>
            <p>
              You retain all ownership rights to content you upload, post, or submit to the platform, including:
            </p>
            <ul>
              <li>Profile information</li>
              <li>Portfolio samples</li>
              <li>Project descriptions</li>
              <li>Messages and communications</li>
              <li>Reviews and ratings</li>
            </ul>

            <h3>3.2 License to 49GIG</h3>
            <p>
              By uploading content, you grant 49GIG a worldwide, non-exclusive, royalty-free, transferable, sublicensable license to:
            </p>
            <ul>
              <li>Use, reproduce, display, and distribute your content on the platform</li>
              <li>Modify or adapt content for technical or formatting purposes</li>
              <li>Promote the platform using your content (with permission)</li>
              <li>Archive content for compliance and record-keeping</li>
            </ul>

            <h3>3.3 User Representations</h3>
            <p>
              By uploading content, you represent and warrant that:
            </p>
            <ul>
              <li>You own or have the rights to the content</li>
              <li>The content does not infringe on third-party intellectual property</li>
              <li>You have obtained all necessary permissions, licenses, and consents</li>
              <li>The content complies with applicable laws and platform policies</li>
            </ul>

            <h2>4. Work Product and Deliverables</h2>
            <h3>4.1 Default Ownership</h3>
            <p>
              By default, intellectual property rights in work product created by freelancers are transferred to the client upon full payment, unless otherwise specified in the project contract.
            </p>

            <h3>4.2 Custom Agreements</h3>
            <p>
              Clients and freelancers may negotiate different intellectual property arrangements, including:
            </p>
            <ul>
              <li>Freelancer retention of ownership with client license</li>
              <li>Shared ownership or co-ownership</li>
              <li>Limited use rights or geographic restrictions</li>
              <li>Moral rights waiver or attribution requirements</li>
            </ul>

            <h3>4.3 Work Made for Hire</h3>
            <p>
              Where applicable by law, work product may be considered "work made for hire," with the client as the legal author and owner of copyright.
            </p>

            <h3>4.4 Pre-Existing Materials</h3>
            <p>
              Freelancers retain rights to pre-existing materials, tools, templates, or intellectual property incorporated into deliverables, subject to licensing terms.
            </p>

            <h2>5. Copyright Infringement</h2>
            <h3>5.1 Prohibition</h3>
            <p>
              Users must not upload, post, or submit content that infringes on the copyright or intellectual property rights of others. This includes:
            </p>
            <ul>
              <li>Plagiarized written content</li>
              <li>Unauthorized use of images, graphics, or designs</li>
              <li>Pirated software or digital assets</li>
              <li>Copyrighted music, videos, or media</li>
            </ul>

            <h3>5.2 DMCA Takedown Process</h3>
            <p>
              49GIG complies with the Digital Millennium Copyright Act (DMCA). Copyright owners who believe their work has been infringed may submit a takedown notice to dmca@49gig.com.
            </p>

            <h3>5.3 Takedown Notice Requirements</h3>
            <p>A valid DMCA takedown notice must include:</p>
            <ul>
              <li>Identification of the copyrighted work</li>
              <li>Identification of the infringing material and its location</li>
              <li>Contact information of the copyright owner</li>
              <li>Statement of good faith belief that use is unauthorized</li>
              <li>Statement of accuracy under penalty of perjury</li>
              <li>Physical or electronic signature of copyright owner</li>
            </ul>

            <h3>5.4 Counter-Notice Process</h3>
            <p>
              Users whose content is removed may submit a counter-notice if they believe the takedown was erroneous. Counter-notices must include similar information and a statement that the user consents to jurisdiction.
            </p>

            <h3>5.5 Repeat Infringers</h3>
            <p>
              49GIG will terminate accounts of users who repeatedly infringe on intellectual property rights.
            </p>

            <h2>6. Trademarks</h2>
            <h3>6.1 49GIG Trademarks</h3>
            <p>
              "49GIG," the 49GIG logo, and other platform marks are trademarks of 49GIG. Use of these trademarks without permission is prohibited.
            </p>

            <h3>6.2 Third-Party Trademarks</h3>
            <p>
              Other trademarks, service marks, and logos displayed on the platform are the property of their respective owners. Users must not use these marks without authorization.
            </p>

            <h2>7. Confidential Information</h2>
            <h3>7.1 Definition</h3>
            <p>
              Confidential information includes non-public business information, technical data, trade secrets, client information, and proprietary materials shared during projects.
            </p>

            <h3>7.2 Non-Disclosure Obligations</h3>
            <p>
              Freelancers and clients must:
            </p>
            <ul>
              <li>Keep confidential information secure</li>
              <li>Not disclose confidential information to third parties</li>
              <li>Use confidential information only for project purposes</li>
              <li>Return or destroy confidential information upon project completion</li>
            </ul>

            <h3>7.3 Non-Disclosure Agreements (NDAs)</h3>
            <p>
              Clients may require freelancers to sign NDAs before accessing sensitive information. Both parties must honor NDA terms.
            </p>

            <h2>8. Portfolio and Marketing Use</h2>
            <h3>8.1 Freelancer Portfolio Rights</h3>
            <p>
              Freelancers may display completed work in their portfolios unless:
            </p>
            <ul>
              <li>The client specifically prohibits portfolio use in the contract</li>
              <li>The work contains confidential or sensitive information</li>
              <li>An NDA restricts disclosure</li>
            </ul>

            <h3>8.2 Client Attribution</h3>
            <p>
              When displaying work in portfolios, freelancers should:
            </p>
            <ul>
              <li>Obtain client permission where possible</li>
              <li>Anonymize client information if requested</li>
              <li>Provide accurate attribution and context</li>
            </ul>

            <h2>9. Dispute Resolution</h2>
            <h3>9.1 Intellectual Property Disputes</h3>
            <p>
              Disputes regarding intellectual property ownership should be resolved directly between clients and freelancers. 49GIG may provide mediation support but does not adjudicate IP disputes.
            </p>

            <h3>9.2 Platform Dispute Process</h3>
            <p>
              Users may request 49GIG intervention in IP disputes. We will review contracts, communications, and evidence to facilitate resolution.
            </p>

            <h2>10. Reporting IP Violations</h2>
            <p>To report intellectual property violations:</p>
            <ul>
              <li><strong>Copyright Infringement:</strong> dmca@49gig.com</li>
              <li><strong>Trademark Issues:</strong> legal@49gig.com</li>
              <li><strong>General IP Concerns:</strong> ip@49gig.com</li>
            </ul>

            <h2>11. International Considerations</h2>
            <p>
              Intellectual property laws vary by country. Users are responsible for complying with applicable laws in their jurisdiction and the jurisdiction of the other party.
            </p>

            <h2>12. Updates to This Policy</h2>
            <p>
              We may update this Intellectual Property Policy from time to time. Material changes will be communicated through the platform.
            </p>

            <h2>13. Contact Information</h2>
            <p>For intellectual property questions or concerns:</p>
            <ul>
              <li><strong>IP Team:</strong> ip@49gig.com</li>
              <li><strong>DMCA Agent:</strong> dmca@49gig.com</li>
              <li><strong>Legal:</strong> legal@49gig.com</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

