"use client";
import { useState } from "react";

export default function OnboardingForm() {
  const [form, setForm] = useState({
    height: "", weight: "", gender: "", allergies: "",
    exclusions: "", cuisine: "", activityLevel: "", goal: "",
    cookingTime: ""
  });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) window.location.href = "/";
  };

  return (
    <form onSubmit={onSubmit} style={{display:"grid",gap:8,maxWidth:400,margin:"2rem auto"}}>
      <input name="height" value={form.height} onChange={onChange} placeholder="Height (cm)" />
      <input name="weight" value={form.weight} onChange={onChange} placeholder="Weight (kg)" />
      <input name="gender" value={form.gender} onChange={onChange} placeholder="Gender" />
      <input name="allergies" value={form.allergies} onChange={onChange} placeholder="Allergies" />
      <input name="exclusions" value={form.exclusions} onChange={onChange} placeholder="Exclusions" />
      <input name="cuisine" value={form.cuisine} onChange={onChange} placeholder="Preferred Cuisine" />
        <select name="activityLevel" value={form.activityLevel} onChange={onChange}>
            <option value="">Select activity level</option>
            <option value="sedentary">Sedentary</option>
            <option value="light">Light</option>
            <option value="moderate">Moderate</option>
            <option value="active">Active</option>
            <option value="very active">Very Active</option>
            </select>

            <select name="goal" value={form.goal} onChange={onChange}>
            <option value="">Select goal</option>
            <option value="lose">Weight Loss</option>
            <option value="gain">Weight Gain</option>
            <option value="maintain">Maintain</option>
        </select>

      <input name="cookingTime" value={form.cookingTime} onChange={onChange} placeholder="Cooking Time (min)" />
      <button>Save</button>
    </form>
  );
}
