'use client';

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "bpmn-js/dist/assets/diagram-js.css";

const defaultDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions id="Definitions_0" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_0" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Incident received">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:userTask id="Task_1" name="Triage">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="Gateway_1" />
    <bpmn:exclusiveGateway id="Gateway_1" name="Automation needed?">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Gateway_1" targetRef="Task_2" />
    <bpmn:sequenceFlow id="Flow_4" sourceRef="Gateway_1" targetRef="EndEvent_1" />
    <bpmn:task id="Task_2" name="Initiate automation">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_5</bpmn:outgoing>
    </bpmn:task>
    <bpmn:sequenceFlow id="Flow_5" sourceRef="Task_2" targetRef="EndEvent_2" />
    <bpmn:endEvent id="EndEvent_1" name="Elevate to SME">
      <bpmn:incoming>Flow_4</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:endEvent id="EndEvent_2" name="Resolution">
      <bpmn:incoming>Flow_5</bpmn:incoming>
    </bpmn:endEvent>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_0">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="230" y="90" width="120" height="60" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_1_di" bpmnElement="Gateway_1">
        <dc:Bounds x="380" y="92" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_2_di" bpmnElement="Task_2">
        <dc:Bounds x="460" y="70" width="120" height="60" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="620" y="140" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_2_di" bpmnElement="EndEvent_2">
        <dc:Bounds x="620" y="40" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="211" y="120" />
        <di:waypoint x="230" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="350" y="120" />
        <di:waypoint x="380" y="117" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <di:waypoint x="405" y="117" />
        <di:waypoint x="460" y="100" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4">
        <di:waypoint x="405" y="117" />
        <di:waypoint x="620" y="158" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_5_di" bpmnElement="Flow_5">
        <di:waypoint x="580" y="100" />
        <di:waypoint x="620" y="58" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const paletteTips = [
  {
    title: "Events & triggers",
    description: "Start with start events or signals so flows respond to alerts, webhooks, or scheduled checks.",
  },
  {
    title: "Connectors & automation",
    description: "Drag service tasks and script tasks from the palette to represent automated systems or runbooks.",
  },
  {
    title: "Decision points",
    description: "Use gateways to create branching logic, keeping every outgoing path labeled so reviewers know what happens next.",
  },
];

export default function FlowBuilderPage() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<import("bpmn-js/lib/Modeler").default | null>(null);
  const paletteStyleRef = useRef<HTMLStyleElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    let localModeler: import("bpmn-js/lib/Modeler").default | null = null;

    (async () => {
      try {
        const { default: BpmnModeler } = await import("bpmn-js/lib/Modeler");
        if (!canvasRef.current) {
          return;
        }

        localModeler = new BpmnModeler({
          container: canvasRef.current,
      });
        modelerRef.current = localModeler;
        await localModeler.importXML(defaultDiagram);
        const canvas = localModeler.get<any>("canvas");
        canvas.zoom("fit-viewport");
        if (isActive) {
          setIsReady(true);
        }

        if (!paletteStyleRef.current) {
          const style = document.createElement("style");
          style.innerHTML = ".djs-palette { display: none !important; }";
          document.head.appendChild(style);
          paletteStyleRef.current = style;
        }
      } catch (err) {
        console.error(err);
        if (isActive) {
          setError("Unable to load the canvas. Refresh to retry.");
        }
      }
    })();

    return () => {
      isActive = false;
      localModeler?.destroy();
      if (paletteStyleRef.current) {
        paletteStyleRef.current.remove();
        paletteStyleRef.current = null;
      }
    };
  }, []);

  const handleReset = async () => {
    if (!modelerRef.current) {
      return;
    }

    setError(null);
    setIsReady(false);

    try {
      await modelerRef.current.importXML(defaultDiagram);
      const canvasInstance = modelerRef.current.get<any>("canvas");
      canvasInstance.zoom("fit-viewport");
      setIsReady(true);
    } catch {
      setError("Reload failed. Try refreshing the page.");
    }
  };

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[30px] border border-slate-200/60 bg-white/80 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.15)]">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Flow builder</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
          Visualize how AIOps reacts and routes incidents.
        </h1>
        {/* <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="default">Open builder</Button>
          <Button variant="muted">View templates</Button>
        </div> */}
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {/* <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Canvas</p> */}
            <h2 className="text-2xl font-semibold text-slate-900">Agent Work Flow</h2>
            <div className="mt-2 flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="agent-select">
                Agent
              </label>
              <select
                id="agent-select"
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                defaultValue="MQ Agent"
              >
                <option>MQ Agent</option>
                <option>Ticketing Agent</option>
                <option>Monitoring Agent</option>
                <option>Automation Agent</option>
              </select>
            </div>
          </div>
          {/* <Button
            variant="outline"
            size="sm"
            disabled={!isReady && !error}
            onClick={handleReset}
            title="Restore the starter flow while keeping the palette open"
          >
            Reset canvas
          </Button> */}
        </div>

        <div className="relative min-h-[520px] overflow-hidden rounded-[26px] border border-dashed border-slate-300 bg-slate-50">
          <div ref={canvasRef} className="absolute inset-0 h-full w-full" />
          {!isReady && !error && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[26px] bg-white/80 text-sm text-slate-500">
              Loading workspace…
            </div>
          )}
          {error && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[26px] bg-red-50 text-sm text-rose-500">
              {error}
            </div>
          )}
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <div className="md:flex md:items-start md:gap-6">
            {paletteTips.map((tip) => (
              <div key={tip.title} className="flex-1 space-y-1 border-b border-slate-200 py-3 last:border-0 last:pb-0 md:border-b-0 md:border-r">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{tip.title}</p>
                <p className="text-slate-700">{tip.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-2 text-xs uppercase tracking-[0.3em] text-slate-500 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
              Live collaboration ready
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-sky-400"></span>
              Auto-save drafts before deployment
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-400"></span>
              Export BPMN XML or shareable links
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
