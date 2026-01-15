import { internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";

export const getContractContext = internalQuery({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      return null;
    }

    const project = await ctx.db.get(match.projectId);
    const client = project ? await ctx.db.get(project.clientId) : null;
    const freelancer = await ctx.db.get(match.freelancerId);

    if (!project || !client || !freelancer) {
      return null;
    }

    return {
      match: match as Doc<"matches">,
      project: project as Doc<"projects">,
      client: client as Doc<"users">,
      freelancer: freelancer as Doc<"users">,
    };
  },
});
