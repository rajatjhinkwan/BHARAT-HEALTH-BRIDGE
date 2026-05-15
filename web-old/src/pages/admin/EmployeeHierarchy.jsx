import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, UserPlus, X, Mail, Phone, Calendar, Shield } from 'lucide-react';

const mockHierarchy = {
  id: "HOS-DEL-SAD-001",
  name: "Dr. Adam Smith",
  role: "super_admin",
  department: "Administration",
  status: "active",
  email: "asmith@hospital.local",
  phone: "+1-555-0100",
  joinedDate: "2020-01-15",
  permissions: ["Full System Access", "Audit Logs", "Payroll"],
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
  children: [
    {
      id: "HOS-DEL-HAD-002",
      name: "Emily Johnson",
      role: "hospital_admin",
      department: "Management",
      status: "active",
      email: "ejohnson@hospital.local",
      phone: "+1-555-0102",
      joinedDate: "2021-03-22",
      permissions: ["Department Management", "Inventory Approval", "Staff Rosters"],
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      children: [
        {
          id: "HOS-DEL-DOC-042",
          name: "Dr. Rahul Verma",
          role: "doctor",
          department: "ER",
          status: "active",
          email: "rverma@hospital.local",
          phone: "+1-555-0242",
          joinedDate: "2022-07-10",
          permissions: ["Patient Records", "Prescription Writing", "Lab Orders"],
          avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=100&h=100&fit=crop"
        },
        {
          id: "HOS-DEL-NUR-156",
          name: "Nurse Oscar Reyes",
          role: "nurse",
          department: "ICU",
          status: "on_leave",
          email: "oreyes@hospital.local",
          phone: "+1-555-0356",
          joinedDate: "2022-11-05",
          permissions: ["Vitals Entry", "Triage Management"],
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
        }
      ]
    },
    {
      id: "HOS-DEL-PHA-010",
      name: "Sarah Parker",
      role: "pharmacist",
      department: "Pharmacy",
      status: "active",
      email: "sparker@hospital.local",
      phone: "+1-555-0410",
      joinedDate: "2023-01-20",
      permissions: ["Pharmacy Dispensation", "Inventory Viewing"],
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    }
  ]
};

export default function EmployeeHierarchy() {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    if (!wrapperRef.current || !svgRef.current) return;

    const width = wrapperRef.current.clientWidth;
    const height = wrapperRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2}, 100)`);

    // Zoom setup
    const zoom = d3.zoom()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    svg.call(zoom);
    svg.call(zoom.translateBy, width/2, 100);

    const root = d3.hierarchy(mockHierarchy);
    const treeLayout = d3.tree().nodeSize([280, 200]);
    treeLayout(root);

    // Links
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#475569")
      .attr("stroke-width", 2)
      .attr("d", d3.linkVertical()
        .x(d => d.x)
        .y(d => d.y)
      );

    // Nodes
    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedEmployee(d.data);
      });

    node.append("foreignObject")
      .attr("x", -120)
      .attr("y", -30)
      .attr("width", 240)
      .attr("height", 120)
      .style("overflow", "visible")
      .html(d => `
        <div style="
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 12px;
          color: white;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          gap: 12px;
          transition: transform 0.2s, box-shadow 0.2s;
        " class="node-card-inner">
          <img src="${d.data.avatar}" alt="" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid #38bdf8;" />
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: bold; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #f8fafc;">${d.data.name}</div>
            <div style="font-size: 11px; color: #38bdf8; text-transform: uppercase; font-weight: 600; margin-top: 2px;">${d.data.role.replace('_', ' ')}</div>
            <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">Dept: ${d.data.department}</div>
          </div>
          <div style="
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: ${d.data.status === 'active' ? '#10b981' : '#f59e0b'};
            align-self: flex-start;
            box-shadow: 0 0 5px ${d.data.status === 'active' ? '#10b981' : '#f59e0b'};
          "></div>
        </div>
      `);

      // Add hover styles dynamically via JS mapping class
      node.on("mouseover", function() {
        d3.select(this).select('.node-card-inner')
          .style("transform", "scale(1.05)")
          .style("box-shadow", "0 8px 20px rgba(56, 189, 248, 0.2)")
          .style("border-color", "rgba(56, 189, 248, 0.5)");
      })
      .on("mouseout", function() {
        d3.select(this).select('.node-card-inner')
          .style("transform", "scale(1)")
          .style("box-shadow", "0 4px 10px rgba(0, 0, 0, 0.3)")
          .style("border-color", "#334155");
      });

  }, []);

  return (
    <div style={{ height: '90vh', display: 'flex', flexDirection: 'column', background: '#0f172a' }} onClick={() => setSelectedEmployee(null)}>
      <header style={{ padding: '1rem 2rem', background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}>
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', fontWeight: 700 }}>Employee Hierarchy System</h2>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
            <UserPlus size={18} /> Add Employee Node
          </button>
        </div>
      </header>
      
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }} ref={wrapperRef}>
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>
        
        <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(10px)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', fontSize: '0.85rem', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
          <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>Network Controls</strong>
          <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <li>Scroll to Zoom In/Out</li>
            <li>Drag background to Pan</li>
            <li>Click node to inspect identity</li>
          </ul>
        </div>

        {/* Selected Employee Panel */}
        {selectedEmployee && (
          <div 
             onClick={(e) => e.stopPropagation()}
             style={{ 
               position: 'absolute', top: '2rem', right: '2rem', width: '380px', 
               background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(16px)', 
               borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.3)', 
               boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(56, 189, 248, 0.1)', 
               padding: '2rem', animation: 'fadeInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)' 
             }}>
             <button onClick={() => setSelectedEmployee(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', cursor: 'pointer', borderRadius: '50%', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} />
             </button>
             
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
               <img src={selectedEmployee.avatar} alt="Profile" style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #38bdf8', boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)', marginBottom: '1rem' }} />
               <h3 style={{ margin: '0 0 0.25rem 0', color: '#f8fafc', fontSize: '1.4rem' }}>{selectedEmployee.name}</h3>
               <div style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {selectedEmployee.role.replace('_', ' ')}
               </div>
               <span style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 8, height: 8, background: selectedEmployee.status === 'active' ? '#10b981' : '#f59e0b', borderRadius: '50%' }}></div>
                  {selectedEmployee.status === 'active' ? 'Active Clearance' : 'Leave of Absence'}
               </span>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#e2e8f0' }}>
                   <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px' }}><Search size={18} color="#94a3b8"/></div>
                   <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Node ID</div>
                      <div style={{ fontSize: '0.95rem', fontFamily: 'monospace' }}>{selectedEmployee.id}</div>
                   </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#e2e8f0' }}>
                   <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px' }}><Mail size={18} color="#94a3b8"/></div>
                   <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Secure Comms</div>
                      <div style={{ fontSize: '0.95rem' }}>{selectedEmployee.email}</div>
                   </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#e2e8f0' }}>
                   <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px' }}><Phone size={18} color="#94a3b8"/></div>
                   <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Direct Line</div>
                      <div style={{ fontSize: '0.95rem' }}>{selectedEmployee.phone}</div>
                   </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#e2e8f0' }}>
                   <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px' }}><Calendar size={18} color="#94a3b8"/></div>
                   <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Induction Date</div>
                      <div style={{ fontSize: '0.95rem' }}>{selectedEmployee.joinedDate}</div>
                   </div>
                </div>
             </div>

             <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', color: '#f8fafc', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <Shield size={16} color="#38bdf8"/> Access Clearance
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                   {selectedEmployee.permissions ? selectedEmployee.permissions.map((perm, idx) => (
                      <span key={idx} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                         {perm}
                      </span>
                   )) : (
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Standard Access</span>
                   )}
                </div>
             </div>
          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}} />
    </div>
  );
}
