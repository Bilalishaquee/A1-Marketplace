ALTER TABLE "Project" ADD COLUMN "selectedBudgetCents" INTEGER;
ALTER TABLE "Bid" ADD COLUMN "siteVisitRequested" BOOLEAN NOT NULL DEFAULT false;
