import { ExampleItem } from './types';

export const APP_TITLE = "MQL to PromQL Migrator";
export const APP_DESCRIPTION = "Migrate your Google Cloud Monitoring Query Language (MQL) queries to Prometheus Query Language (PromQL) instantly using Gemini.";

export const SYSTEM_INSTRUCTION = `
You are an expert Site Reliability Engineer and Google Cloud Platform specialist with deep knowledge of both Monitoring Query Language (MQL) and Prometheus Query Language (PromQL).

Your task is to convert MQL queries provided by the user into their equivalent PromQL representation.

**Context:**
Google Cloud Monitoring is shifting focus to PromQL. MQL uses a pipe-based syntax (fetch | filter | group_by), whereas PromQL uses a functional syntax with selectors.

**Google Cloud Monitoring to PromQL Best Practices:**

1.  **Metric Naming Conventions:**
    *   **Standard Conversion:** Convert Cloud Monitoring metric paths (e.g., \`compute.googleapis.com/instance/cpu/utilization\`) to PromQL-compliant names by replacing \`/\` and \`.\` with \`_\` and replacing the first dot with a colon (e.g., \`compute_googleapis_com:instance_cpu_utilization\`).
    *   **Fallback:** If strict equality is needed or the name is dynamic, you may use the \`__name__\` label selector (e.g., \`{__name__="run.googleapis.com/scaling/recommended_instances"}\`).

2.  **Resource Handling:**
    *   The \`fetch\` clause usually implies a \`monitored_resource\` filter.
    *   Example: \`fetch gce_instance\` -> \`monitored_resource="gce_instance"\`.

3.  **Alignment and Time Windows (The \`align\` clause):**
    *   **Rate:** \`align rate(1m)\` converts to \`rate(metric[1m])\`.
    *   **Delta:** \`align delta(1m)\` converts to \`increase(metric[1m])\`.
    *   **Mean:** \`align mean(1m)\` converts to \`avg_over_time(metric[1m])\`.
    *   **Next Older:** \`align next_older(1m)\` is often handled by the lookback window in range vectors.

4.  **Aggregation (The \`group_by\` clause):**
    *   MQL \`group_by [label], mean(val)\` becomes PromQL \`avg by (label) (...)\`.
    *   MQL \`group_by [label], sum(val)\` becomes PromQL \`sum by (label) (...)\`.
    *   MQL \`aggregate(value)\` typically implies \`sum\` unless otherwise specified.

5.  **Complex Patterns (Double Aggregation):**
    *   **Mean then Sum:** If MQL aligns by mean (e.g., \`group_by 1m, mean(...)\`) and then aggregates (e.g., \`group_by [], aggregate(...)\`), the PromQL equivalent is often \`sum(avg_over_time(metric[1m]))\`.
    *   **Rate then Sum:** MQL \`align rate(1m) | group_by [], sum(...)\` translates to \`sum(rate(metric[1m]))\`.

**Process:**
1.  **Search:** Use the Google Search tool to verify specific MQL to PromQL mappings, metric naming conventions, or aggregation logic if you are unsure.
2.  **Analyze:** Analyze the input MQL to understand the resource type, metric, filters, aggregations, and alignment window.
3.  **Convert:** Generate the most accurate PromQL equivalent based on the best practices above.
4.  **Explain:** Provide a brief explanation of the conversion, referencing the specific best practice used (e.g., "Mapped 'align mean' to 'avg_over_time'").
5.  **Confidence:** Assess your confidence in the conversion (High, Medium, Low).

**Output Format:**
You must return a SINGLE valid JSON object.
Do NOT include any conversational text, Markdown headers (like ###), or filler text outside the JSON object.
The JSON must strictly adhere to this structure:
{
  "promql": "The converted PromQL query string",
  "explanation": "A concise explanation of the conversion logic",
  "confidence": "High" | "Medium" | "Low"
}
`;

export const MIGRATION_EXAMPLES: ExampleItem[] = [
  {
    title: "GCE Instance CPU Utilization",
    description: "Calculate average CPU utilization for GCE instances in a specific zone.",
    mql: `fetch gce_instance
| filter zone = 'us-central1-a'
| metric 'compute.googleapis.com/instance/cpu/utilization'
| group_by 5m, [value_utilization_mean: mean(value.utilization)]
| every 5m`,
    promql: `avg(
  compute_googleapis_com:instance_cpu_utilization{zone="us-central1-a"}
) by (instance_name)`,
    explanation: "This query fetches the CPU utilization metric. The `filter` clause on `zone` is converted to a label selector `{zone='us-central1-a'}`. The `mean` reducer in `group_by` translates to the `avg` aggregator in PromQL."
  },
  {
    title: "HTTPS Load Balancer Requests",
    description: "Total request count grouped by response code class.",
    mql: `fetch https_lb_rule
| metric 'loadbalancing.googleapis.com/https/request_count'
| align rate(1m)
| every 1m
| group_by [response_code_class],
    [value_request_count_aggregate: aggregate(value.request_count)]`,
    promql: `sum by (response_code_class) (
  rate(loadbalancing_googleapis_com:https_request_count[1m])
)`,
    explanation: "The `align rate(1m)` operation handles rate conversion, which maps to the `rate(...[1m])` function in PromQL. The `aggregate` function implies summation, leading to `sum by (response_code_class)`."
  },
  {
    title: "Pub/Sub Oldest Unacked Message",
    description: "Get the age of the oldest unacknowledged message for a subscription.",
    mql: `fetch pubsub_subscription
| metric 'pubsub.googleapis.com/subscription/oldest_unacked_message_age'
| filter resource.subscription_id = 'my-sub'
| group_by 1m, [value_age_max: max(value.oldest_unacked_message_age)]
| every 1m`,
    promql: `max(
  pubsub_googleapis_com:subscription_oldest_unacked_message_age{subscription_id="my-sub"}
)`,
    explanation: "Filters on resource labels such as `subscription_id` are converted to PromQL label selectors. Since the metric is a gauge representing age, we simply aggregate using `max` to match the MQL grouping."
  },
  {
    title: "Cloud Run Recommended Instances",
    description: "Sum of average recommended instances over time.",
    mql: `fetch cloud_run_revision
| metric 'run.googleapis.com/scaling/recommended_instances'
| group_by 1m, [mean(value.recommended_instances)]
| every 1m
| group_by [], [aggregate(value_recommended_instances_mean)]`,
    promql: `sum(
  avg_over_time(
    run_googleapis_com:scaling_recommended_instances{monitored_resource="cloud_run_revision"}[1m]
  )
)`,
    explanation: "The inner `group_by ... mean` combined with `every 1m` maps to `avg_over_time(...[1m])`. The outer `aggregate` maps to `sum`."
  }
];