import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { getOwner } from "@ember/application";
import { ajax } from "discourse/lib/ajax";

const componentNameOverrides = {
  // avoids name collision with core's custom-html component
  "custom-html": "custom-html-rsb",
};

export default class RightSidebarBlocks extends Component {
  @tracked blocks = [];

  constructor() {
    super(...arguments);

    const blocksArray = [];

    JSON.parse(settings.blocks).forEach((block) => {
      block.internalName =
        block.name in componentNameOverrides
          ? componentNameOverrides[block.name]
          : block.name;

      if (getOwner(this).hasRegistration(`component:${block.internalName}`)) {
        block.classNames = `rs-component rs-${block.name}`;
        block.parsedParams = {};
        if (block.params) {
          block.params.forEach((p) => {
            block.parsedParams[p.name] = p.value;
          });
        }
        
        blocksArray.push(block);
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          `The component "${block.name}" was not found, please update the configuration for discourse-right-sidebar-blocks.`
        );
      }
    });

    this.blocks = blocksArray;
  }
  handleBlockClick(block, event) {
    console.log(event)
    event.preventDefault(); 

    const apiEndpoint = settings.api_endpoint;
    if (!apiEndpoint || !block.campaign_id || !settings.placement_id) {
      console.warn("check block configuration - missing required settings");
      const href = event.target.getAttribute('href'); 
      if (href) {
        const url = new URL(href);
        this.router.transitionTo(url.pathname + url.search);
      }
      return;
    }

    const payload = {
      placementID: settings.placement_id,
      campaignID: block.campaign_id,
    };

    ajax(apiEndpoint, {
      method: "POST",
      data: payload,
      headers: {
        "Content-Type": "application/json",
        referrer: document.referrer,
      },
    })
      .then(() => {
        console.log("Analytics event sent successfully.");
        const href = event.target.getAttribute('href'); 
        if (href) {
          const url = new URL(href);
          this.router.transitionTo(url.pathname + url.search);
        }
      })
      .catch((error) => {
        console.error("Error sending analytics event:", error);
        const href = event.target.getAttribute('href'); 
        if (href) {
          const url = new URL(href);
          this.router.transitionTo(url.pathname + url.search);
        } 
      });
  }
}
